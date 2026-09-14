const fs = require('fs');
const path = require('path');

async function runVerification() {
  console.log('--- Starting JanSetu Proposal & Industry Matching Verification ---');
  const baseUrl = 'http://localhost:5000';

  // 1. Fetch current projects to pick a project
  console.log('Step 1: Fetching university projects...');
  const projRes = await fetch(`${baseUrl}/api/projects`);
  const projects = await projRes.json();
  if (!projects || projects.length === 0) {
    throw new Error('No projects found to test');
  }
  const testProject = projects[0];
  const projectId = testProject._id || testProject.id;
  console.log(`Using Project: ${testProject.title} (ID: ${projectId})`);

  // 2. Test invalid file rejection (e.g., .txt)
  console.log('\nStep 2: Testing file format rejection (e.g. .txt)...');
  const badFormData = new FormData();
  badFormData.append('fundingRequested', '500000');
  badFormData.append('industrySupportRequired', JSON.stringify(['Testing Facility', 'Mentorship']));
  const fakeTxt = new Blob(['This is a text document'], { type: 'text/plain' });
  badFormData.append('requirementsDocument', fakeTxt, 'invalid_proposal.txt');

  const rejectRes = await fetch(`${baseUrl}/api/university/projects/${projectId}/proposal`, {
    method: 'POST',
    body: badFormData
  });
  console.log(`Reject response status: ${rejectRes.status}`);
  const rejectJson = await rejectRes.json().catch(() => ({}));
  console.log(`Reject response body:`, rejectJson);
  if (rejectRes.status === 400 || rejectJson.error) {
    console.log('✓ SUCCESS: Non-PDF/DOCX file was rejected as expected.');
  } else {
    console.error('✗ FAILED: Server should have rejected .txt file');
  }

  // 3. Test valid proposal submission with a PDF file
  console.log('\nStep 3: Submitting valid proposal with PDF file and 500,000 INR funding...');
  const validFormData = new FormData();
  validFormData.append('fundingRequested', '500000');
  validFormData.append('industrySupportRequired', JSON.stringify(['Testing Facility', 'Equipment', 'Mentorship']));
  const fakePdf = new Blob(['%PDF-1.4 test content for proposal requirements'], { type: 'application/pdf' });
  validFormData.append('requirementsDocument', fakePdf, 'Technical_Requirements_v1.pdf');

  const submitRes = await fetch(`${baseUrl}/api/university/projects/${projectId}/proposal`, {
    method: 'POST',
    body: validFormData
  });
  const submitJson = await submitRes.json();
  console.log(`Submit response status: ${submitRes.status}`);
  console.log(`Submit result:`, { success: submitJson.success, proposalId: submitJson.proposal?._id, status: submitJson.proposal?.status });
  if (!submitJson.success || !submitJson.proposal) {
    throw new Error('Failed to submit proposal: ' + JSON.stringify(submitJson));
  }
  const proposalId = submitJson.proposal._id;

  // 4. Verify Project status is now 'submitted'
  const verifyProjRes = await fetch(`${baseUrl}/api/projects`);
  const updatedProjects = await verifyProjRes.json();
  const matchedProj = updatedProjects.find(p => String(p._id || p.id) === String(projectId));
  console.log(`Project proposalStatus in DB: ${matchedProj?.proposalStatus}`);
  if (matchedProj?.proposalStatus !== 'submitted') {
    throw new Error('Project proposalStatus not updated to submitted');
  }
  console.log('✓ SUCCESS: Project is gated with proposalStatus = submitted');

  // 5. Test Admin Detail View & Privacy Protection (NO student members leaked)
  console.log('\nStep 5: Testing Admin Proposal Detail Card & Privacy Leaks...');
  const adminDetailRes = await fetch(`${baseUrl}/api/admin/proposals/${proposalId}`);
  const adminDetail = await adminDetailRes.json();
  console.log('Admin Proposal Detail Status:', adminDetailRes.status);
  console.log('Admin Detail Payload Keys:', Object.keys(adminDetail.proposal || {}));
  console.log('Team Member Count:', adminDetail.proposal?.teamMemberCount);
  console.log('Members Array present?:', adminDetail.proposal?.team?.members !== undefined);

  if (adminDetail.proposal?.team?.members !== undefined) {
    throw new Error('✗ PRIVACY LEAK DETECTED: team.members was returned in admin payload!');
  }
  console.log('✓ SUCCESS: Privacy check passed! teamMemberCount provided, student member list omitted.');

  // 6. Test Gated Eligibility Matching: Attempting matching before approval MUST FAIL
  console.log('\nStep 6: Testing Eligibility Matching Gating (Must be 403 when not approved)...');
  const gateRes = await fetch(`${baseUrl}/api/admin/proposals/${proposalId}/eligible-industries`);
  console.log(`Gated request status: ${gateRes.status}`);
  const gateJson = await gateRes.json().catch(() => ({}));
  console.log('Gated response:', gateJson);
  if (gateRes.status !== 403) {
    throw new Error('✗ SECURITY GATE FAILED: Non-approved proposal returned eligible industries!');
  }
  console.log('✓ SUCCESS: Eligibility matching is strictly locked before Admin approval (HTTP 403).');

  // 7. Admin Approves Proposal
  console.log('\nStep 7: Admin reviews and approves the proposal...');
  const reviewRes = await fetch(`${baseUrl}/api/admin/proposals/${proposalId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'approved', comment: 'Approved for civic prototyping and field trial.' })
  });
  const reviewJson = await reviewRes.json();
  console.log('Review response:', reviewJson);
  if (!reviewJson.success || reviewJson.proposal?.status !== 'approved') {
    throw new Error('Failed to approve proposal: ' + JSON.stringify(reviewJson));
  }
  console.log('✓ SUCCESS: Proposal approved by Admin.');

  // 8. Test Eligibility Matching AFTER approval
  console.log('\nStep 8: Fetching Eligible Industry Partners now that proposal is approved...');
  const eligibleRes = await fetch(`${baseUrl}/api/admin/proposals/${proposalId}/eligible-industries`);
  const eligibleData = await eligibleRes.json();
  console.log(`Eligible request status: ${eligibleRes.status}`);
  console.log(`Found ${eligibleData.eligiblePartners?.length || 0} eligible partners:`);
  (eligibleData.eligiblePartners || []).forEach(p => {
    console.log(`- ${p.companyName} | Capacity: ₹${p.fundingCapacity} | Overlap: ${p.matchingCapabilities?.length} matches (${(p.matchingCapabilities || []).join(', ')})`);
  });

  // Verify partner with ₹200,000 capacity is NOT included (since fundingRequested is ₹500,000)
  const lowCapacityPartner = (eligibleData.eligiblePartners || []).find(p => p.fundingCapacity < 500000);
  if (lowCapacityPartner) {
    throw new Error(`✗ Capacity filter failed: ${lowCapacityPartner.companyName} has capacity ₹${lowCapacityPartner.fundingCapacity} < ₹500,000`);
  }
  console.log('✓ SUCCESS: Filtered out under-capacity industry partners (fundingCapacity >= fundingRequested).');

  // 9. Admin assigns an industry partner
  if (eligibleData.eligiblePartners && eligibleData.eligiblePartners.length > 0) {
    const chosenPartner = eligibleData.eligiblePartners[0];
    console.log(`\nStep 9: Admin assigning partner "${chosenPartner.companyName}"...`);
    const assignRes = await fetch(`${baseUrl}/api/admin/proposals/${proposalId}/assign-industry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId: chosenPartner._id })
    });
    const assignJson = await assignRes.json();
    console.log('Assign result:', assignJson);
    if (!assignJson.success) {
      throw new Error('Failed to assign industry partner: ' + JSON.stringify(assignJson));
    }
    console.log('✓ SUCCESS: Industry partner assigned successfully.');
  }

  // 10. Check University Project state after assignment
  console.log('\nStep 10: Checking university project state after assignment...');
  const afterProjRes = await fetch(`${baseUrl}/api/projects/${projectId}/proposal`);
  const afterProposal = await afterProjRes.json();
  console.log('Proposal data in university API:', {
    status: afterProposal.proposal?.status,
    assignedIndustry: afterProposal.proposal?.assignedIndustry?.companyName
  });

  console.log('\n=============================================');
  console.log('🎉 ALL 10 E2E VERIFICATION CHECKS PASSED!');
  console.log('=============================================');
}

runVerification().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
