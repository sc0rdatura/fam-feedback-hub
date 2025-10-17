// =================================================================
//  IMPORTS
// =================================================================
import { onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, onSnapshot, doc, getDoc, addDoc, serverTimestamp, getDocs, orderBy, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from './firebase-init.js';

// =================================================================
//  DOM ELEMENT CACHING
// =================================================================
const issuesContainer = document.getElementById('issues-container');
const archivedIssuesContainer = document.getElementById('archived-issues-container');
const detailsModal = document.getElementById('details-modal');
const detailsTitle = document.getElementById('details-title');
const detailsContent = document.getElementById('details-content');
const logNewIssueBtn = document.getElementById('log-new-issue-btn');
const formModal = document.getElementById('form-modal');
const issueForm = document.getElementById('issue-form');
const submitBtn = document.getElementById('submit-btn');
const categorySelect = document.getElementById('category');
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');
const searchBar = document.getElementById('search-bar');
const filterCategorySelect = document.getElementById('filter-category-select');
const filterStatusSelect = document.getElementById('filter-status-select');
const filterPrioritySelect = document.getElementById('filter-priority-select');
const filterSubmitterSelect = document.getElementById('filter-submitter-select');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const sortSelect = document.getElementById('sort-select');
const loginScreen = document.getElementById('login-screen');
const mainAppContainer = document.getElementById('main-app-container');
const peopleListContainer = document.getElementById('people-list-container');
const userDisplayContainer = document.getElementById('user-display');
const userNameDisplay = document.getElementById('user-name-display');
const logoutBtn = document.getElementById('logout-btn');
const archivedSection = document.getElementById('archived-section');
const archivedHeader = document.getElementById('archived-header');
const pinnedIssuesContainer = document.getElementById('pinned-issues-container');

// =================================================================
//  CONSTANTS & ICONS
// =================================================================
const STATUS_OPTIONS = ['New', 'In Progress', 'Resolved'];
const dotsIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>';
const archiveButtonSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 1a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1H.5zM1 2.5v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-11H1zm2 3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5z" /></svg>';
const unarchiveIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zM2 4v8h12V4zM8.5 7.146a.5.5 0 0 0-.708.708L9.293 9.354a.5.5 0 0 0 .708 0l1.5-1.5a.5.5 0 0 0-.708-.708L10 8.293zM10 5.5a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0z"/></svg>';
const pinIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .146-.353z"/></svg>';
const logoutIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/><path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/></svg>';
const CLOUDINARY_CLOUD_NAME = 'dqnjmlc9n';
const CLOUDINARY_UPLOAD_PRESET = 'uwhbjka9';

// =================================================================
//  STATE
// =================================================================
let firebaseUser = null;
let loggedInPerson = null;
let allIssues = [];

// =================================================================
//  CORE APPLICATION LOGIC
// =================================================================

/**
 * Logs the user out by clearing localStorage and reloading the page.
 */
function handleLogout() {
  localStorage.removeItem('loggedInUser');
  location.reload();
}

/**
 * Shows the confirmation modal for archiving an issue.
 */
function showArchiveConfirm(issueId) {
  confirmTitle.textContent = 'Confirm Archival';
  confirmMessage.textContent = 'Are you sure you want to archive this issue?';
  confirmModal.style.display = 'block';

  confirmYesBtn.onclick = () => {
    handleStatusChange(issueId, 'Archived');
    confirmModal.style.display = 'none';
  };
}

/**
 * Updates an issue's status in Firestore.
 */
async function handleStatusChange(issueId, newStatus) {
  console.log(`Updating status for ${issueId} to ${newStatus}`);
  const docRef = doc(db, "issues", issueId);
  try {
    await updateDoc(docRef, { status: newStatus });
    console.log("Status updated successfully!");
  } catch (error) {
    console.error("Error updating status:", error);
    alert("Failed to update status. Please try again.");
  }
}

/**
 * Toggles an issue's 'isPinned' status in Firestore.
 */
async function handlePinToggle(issueId, shouldPin) {
  console.log(`Setting pin status for ${issueId} to ${shouldPin}`);
  const docRef = doc(db, "issues", issueId);
  try {
    await updateDoc(docRef, { isPinned: shouldPin });
    console.log("Pin status updated successfully!");
  } catch (error) {
    console.error("Error updating pin status:", error);
    alert("Failed to update pin status.");
  }
}

/**
 * Uploads a file to Cloudinary using an unsigned preset.
 * @param {File} file The file object to upload.
 * @returns {Promise<string>} A promise that resolves with the secure URL of the uploaded image.
 */
async function uploadScreenshotToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    console.error('Cloudinary upload failed:', await response.json());
    throw new Error('Could not upload the screenshot. Please try again.');
  }

  const data = await response.json();
  return data.secure_url; // This is the public URL of the uploaded image
}

/**
 * Fetches categories from Firestore and populates the dropdowns.
 */
async function populateCategoryDropdown() {
  console.log("Fetching categories...");
  try {
    const querySnapshot = await getDocs(collection(db, "categories"));
    let formOptionsHtml = '<option value="" disabled selected>Select a Category</option>';
    let filterOptionsHtml = '<option value="all">All</option>';
    querySnapshot.forEach((doc) => {
      const categoryName = doc.data().name;
      formOptionsHtml += `<option value="${categoryName}">${categoryName}</option>`;
      filterOptionsHtml += `<option value="${categoryName}">${categoryName}</option>`;
    });
    categorySelect.innerHTML = formOptionsHtml;
    filterCategorySelect.innerHTML = filterOptionsHtml;
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
}

/**
 * Handles the submission of the new issue form.
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  if (!firebaseUser || !loggedInPerson) {
    alert("You must be logged in to submit an issue.");
    return;
  }

  // Get the file from the form input
  const screenshotFile = issueForm.screenshot.files[0];

  // --- VALIDATION ---
  if (screenshotFile) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(screenshotFile.type)) {
      alert('Invalid file type. Please upload a JPG, PNG, GIF, or WEBP image.');
      return; // Stop the submission
    }

    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (screenshotFile.size > maxSizeInBytes) {
      alert('File is too large. The maximum size is 5MB.');
      return; // Stop the submission
    }
  }
  
  submitBtn.disabled = true;

  try {
    let screenshotUrl = null;
    // --- UPLOAD ---
    if (screenshotFile) {
      submitBtn.textContent = 'Uploading Screenshot...';
      screenshotUrl = await uploadScreenshotToCloudinary(screenshotFile);
    }

    submitBtn.textContent = 'Saving Issue...';
    
    // --- CREATE FIRESTORE DOCUMENT ---
    const formData = new FormData(issueForm);
    const newIssue = {
      title: formData.get('title'),
      category: formData.get('category'),
      type: formData.get('type'),
      priority: formData.get('priority'),
      description: formData.get('description'),
      submitterId: firebaseUser.uid,
      submitterName: loggedInPerson.name,
      status: "New",
      isPinned: false,
      commentCount: 0, // Initialize comment count
      createdAt: serverTimestamp()
    };

    // Add the screenshot URL to the issue object if it exists
    if (screenshotUrl) {
      newIssue.screenshots = [screenshotUrl]; // Store in an array for future-proofing
    }

    await addDoc(collection(db, "issues"), newIssue);

    console.log("New issue submitted successfully!");
    issueForm.reset();
    formModal.style.display = 'none';

  } catch (error) {
    console.error("Error submitting new issue:", error);
    alert(error.message || "There was an error submitting your issue. Please try again.");
  } finally {
    // Reset button state regardless of success or failure
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Issue';
  }
}

/**
 * Populates the details modal with issue data and comments, then displays it.
 */
function populateAndShowDetailsModal(issueId, issue) {
  detailsTitle.textContent = `Issue: ${issue.title || 'No Title'}`;

  let detailsHtml = `
    <div class="details-grid">
      <div><strong>Submitter:</strong> ${issue.submitterName || 'Unknown'}</div>
      <div><strong>Category:</strong> ${issue.category || 'N/A'}</div>
      <div><strong>Priority:</strong> ${issue.priority || 'Low'}</div>
      <div><strong>Date:</strong> ${issue.createdAt ? new Date(issue.createdAt.toDate()).toLocaleString() : 'N/A'}</div>
      <div><strong>Status:</strong> ${issue.status || 'N/A'}</div>
      <div><strong>Type:</strong> ${issue.type || 'N/A'}</div>
    </div>
    <h4>Description</h4>
    <p class="details-description">${issue.description || 'No description provided.'}</p>
    
    <div class="comments-section">
      <h4>Comments</h4>
      <div id="comments-list"><p class="placeholder-text-small">Loading comments...</p></div>
      <form id="add-comment-form">
        <h4>Add a Comment</h4>
        <div class="form-group">
          <label for="comment-text">Comment</label>
          <textarea id="comment-text" name="commentText" rows="3" required></textarea>
        </div>
        <div class="form-actions">
          <button type="submit" id="submit-comment-btn" class="button-primary">Submit Comment</button>
        </div>
      </form>
    </div>
  `;
  detailsContent.innerHTML = detailsHtml;

  const addCommentForm = document.getElementById('add-comment-form');
  addCommentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const commentText = e.target.commentText.value;
    if (commentText.trim()) {
      handleAddComment(issueId, commentText);
      e.target.reset();
    }
  });

  listenForComments(issueId);
  detailsModal.style.display = 'block';
}

/**
 * Fetches a single issue's data from Firestore and opens the details modal.
 */
async function handleViewDetails(issueId) {
  console.log(`Fetching details for issue: ${issueId}`);
  try {
    const docRef = doc(db, "issues", issueId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      populateAndShowDetailsModal(issueId, docSnap.data());
    } else {
      console.error("No such document!");
      alert("Error: Could not find the selected issue.");
    }
  } catch (error) {
    console.error("Error getting document:", error);
    alert("An error occurred while fetching the issue details.");
  }
}

/**
 * Creates a real-time listener for comments on a specific issue.
 */
function listenForComments(issueId) {
  const commentsList = document.getElementById('comments-list');
  const commentsQuery = query(collection(db, `issues/${issueId}/comments`), orderBy("createdAt", "asc"));

  onSnapshot(commentsQuery, (snapshot) => {
    if (snapshot.empty) {
      commentsList.innerHTML = '<p class="placeholder-text-small">No comments yet.</p>';
      return;
    }
    let commentsHtml = '';
    snapshot.forEach(doc => {
      const comment = doc.data();
      commentsHtml += `
        <div class="comment">
          <div class="comment-header">
            <strong>${comment.commenterName}</strong>
            <span>${comment.createdAt ? new Date(comment.createdAt.toDate()).toLocaleString() : ''}</span>
          </div>
          <div class="comment-body">
            <p>${comment.text}</p>
          </div>
        </div>
      `;
    });
    commentsList.innerHTML = commentsHtml;
  }, (error) => {
    console.error("Error fetching comments:", error);
    commentsList.innerHTML = '<p class="placeholder-text-small error">Could not load comments.</p>';
  });
}

/**
 * Adds a new comment document to Firestore.
 */
async function handleAddComment(issueId, text) {
  const submitBtn = document.getElementById('submit-comment-btn');
  submitBtn.disabled = true;

  // Define references to the issue document and the comments subcollection
  const issueDocRef = doc(db, 'issues', issueId);
  const commentsCollectionRef = collection(issueDocRef, 'comments');

  try {
    // Add the new comment document
    await addDoc(commentsCollectionRef, {
      text: text,
      commenterName: loggedInPerson.name,
      createdAt: serverTimestamp()
    });

    // Atomically increment the commentCount on the parent issue document
    await updateDoc(issueDocRef, {
      commentCount: increment(1)
    });

  } catch (error) {
    console.error("Error adding comment: ", error);
    alert("Failed to add comment.");
  } finally {
    submitBtn.disabled = false;
  }
}

/**
 * Generates the HTML string for a single issue card.
 */
function createIssueCardHtml(issue) {
  const issueId = issue.id;
  const priority = issue.priority || 'Low';
  const status = issue.status || 'New';
  const timestamp = issue.createdAt ? new Date(issue.createdAt.toDate()).toLocaleString() : 'No date';

  const statusOptionsHtml = STATUS_OPTIONS.map(option => 
    `<option value="${option}" ${status === option ? 'selected' : ''}>${option}</option>`
  ).join('');

  const statusDropdown = `
    <div class="status-selector">
      <select class="status-select-card" data-id="${issueId}" ${status === 'Archived' ? 'disabled' : ''}>
        ${status === 'Archived' ? `<option>Archived</option>` : statusOptionsHtml}
      </select>
    </div>
  `;

  let menuButtons = '';
  if (status === 'Archived') {
    menuButtons = `<button class="unarchive-btn archive-btn" data-id="${issueId}">${unarchiveIconSVG} Unarchive</button>`;
  } else {
   let pinButton = '';
if (issue.isPinned) {
  // If it's already pinned, the user can always unpin it.
  pinButton = `<button class="pin-btn" data-id="${issueId}" data-pin="false">${pinIconSVG} Unpin</button>`;
} else {
  // If it's not pinned, check the current pin count.
  const pinnedCount = allIssues.filter(i => i.isPinned && i.status !== 'Archived').length;
  if (pinnedCount >= 4) {
    // If the limit is reached, show a disabled button.
    pinButton = `<button class="pin-btn" data-id="${issueId}" disabled title="Maximum of 4 issues can be pinned.">${pinIconSVG} Pin</button>`;
  } else {
    // Otherwise, show the normal pin button.
    pinButton = `<button class="pin-btn" data-id="${issueId}" data-pin="true">${pinIconSVG} Pin</button>`;
  }
}
    
    menuButtons = `
      ${pinButton}
      <button class="archive-btn" data-id="${issueId}">${archiveButtonSVG} Archive</button>
    `;
  }

  const cardMenu = `
    <div class="card-actions-menu">
      <button class="card-actions-toggle">${dotsIconSVG}</button>
      <div class="card-actions-dropdown">
        ${menuButtons}
      </div>
    </div>
  `;

  const archivedClass = status === 'Archived' ? 'status-archived' : '';

  return `
    <div class="issue-card priority-${priority.toLowerCase()} ${archivedClass}">
      <div class="card-header">
        <h3 class="card-title">${issue.title || 'No Title'}</h3>
        <div class="card-header-right">
          <span class="priority-tag priority-${priority.toLowerCase()}">${priority}</span>
          ${statusDropdown}
          ${cardMenu}
        </div>
      </div>
      <div class="card-body clickable" data-id="${issueId}">
        <p>${issue.description || 'No description.'}</p>
      </div>
      <div class="card-footer">
        <div class="card-footer-info">
            <span class="card-info-text"><strong>Submitter:</strong> ${issue.submitterName || 'Unknown'} | <strong>Category:</strong> ${issue.category || 'N/A'}</span>
            <span class="card-timestamp">${timestamp}</span>
        </div>
        <div class="card-footer-actions">
    ${issue.commentCount > 0 ? `
      <div class="comment-count" title="${issue.commentCount} comments">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/></svg>
        <span>${issue.commentCount}</span>
      </div>
    ` : ''}
    <button class="button-secondary button-small details-btn" data-id="${issueId}">View Details</button>
</div>
      </div>
    </div>
  `;
}

/**
 * Takes an array of issues, separates them into pinned, active and archived, and renders them.
 */
function renderIssues(issuesToDisplay) {
  const pinnedSection = document.getElementById('pinned-section');
  const pinnedIssuesContainer = document.getElementById('pinned-issues-container');

  const pinnedIssues = issuesToDisplay.filter(issue => issue.isPinned && issue.status !== 'Archived').slice(0, 4);
  const activeIssues = issuesToDisplay.filter(issue => !issue.isPinned && issue.status !== 'Archived');
  const archivedIssues = issuesToDisplay.filter(issue => issue.status === 'Archived');

  if (pinnedIssues.length > 0) {
    pinnedSection.style.display = 'block';
    pinnedIssuesContainer.innerHTML = pinnedIssues.map(issue => createIssueCardHtml(issue)).join('');
  } else {
    pinnedSection.style.display = 'none';
  }

  if (activeIssues.length > 0) {
    issuesContainer.innerHTML = activeIssues.map(issue => createIssueCardHtml(issue)).join('');
  } else {
    issuesContainer.innerHTML = '<p class="placeholder-text">No active issues match the current filters.</p>';
  }

  if (allIssues.filter(issue => issue.status === 'Archived').length > 0) {
    archivedSection.style.display = 'block';
    document.getElementById('archived-header').querySelector('h3').textContent = `Archived Issues (${archivedIssues.length})`;
    
    if (archivedIssues.length > 0) {
      archivedIssuesContainer.innerHTML = archivedIssues.map(issue => createIssueCardHtml(issue)).join('');
    } else {
      archivedIssuesContainer.innerHTML = '<p class="placeholder-text-small">No archived issues match the current filters.</p>';
    }
  } else {
    archivedSection.style.display = 'none';
  }
}

/**
 * Applies the current filter and sort values to the master 'allIssues' list.
 */
function applyFiltersAndSort() {
  let filteredIssues = [...allIssues];

  const searchTerm = searchBar.value.toLowerCase();
  if (searchTerm) {
    filteredIssues = filteredIssues.filter(issue =>
      ((issue.title || '').toLowerCase().includes(searchTerm) || 
       (issue.description || '').toLowerCase().includes(searchTerm) ||
       (issue.category || '').toLowerCase().includes(searchTerm))
    );
  }

  if (filterCategorySelect.value !== 'all') {
    filteredIssues = filteredIssues.filter(issue => issue.category === filterCategorySelect.value);
  }
  if (filterStatusSelect.value !== 'all') {
    filteredIssues = filteredIssues.filter(issue => issue.status === filterStatusSelect.value);
  }
  if (filterPrioritySelect.value !== 'all') {
    filteredIssues = filteredIssues.filter(issue => issue.priority === filterPrioritySelect.value);
  }
  if (filterSubmitterSelect.value !== 'all') {
    filteredIssues = filteredIssues.filter(issue => issue.submitterName === filterSubmitterSelect.value);
  }

  const sortValue = sortSelect.value;
  const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1, 'New': 0 };
  filteredIssues.sort((a, b) => {
    const timeA = a.createdAt?.toMillis() || 0;
    const timeB = b.createdAt?.toMillis() || 0;

    switch (sortValue) {
      case 'date-oldest': return timeA - timeB;
      case 'priority-high-low': return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      case 'priority-low-high': return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
      case 'submitter-az': return (a.submitterName || '').localeCompare(b.submitterName || '');
      default: return timeB - timeA;
    }
  });

  renderIssues(filteredIssues);
}

/**
 * Sets up the real-time listener. It now only updates the 'allIssues' array.
 */
function listenForIssues() {
  console.log("Setting up listener for issues...");
  const issuesCollection = collection(db, "issues");
  const q = query(issuesCollection);

  onSnapshot(q, (snapshot) => {
    console.log("Received new data from Firestore!");
    allIssues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    applyFiltersAndSort();
  }, (error) => {
    console.error("Error listening for issues:", error);
    issuesContainer.innerHTML = `<p class="placeholder-text error">Error: Could not load issues.</p>`;
  });
}

/**
 * Sets up all the main event listeners for the application.
 */
function setupEventListeners() {
  issuesContainer.addEventListener('click', (e) => {
    const detailsTrigger = e.target.closest('.details-btn, .card-body.clickable');
    if (detailsTrigger) {
      handleViewDetails(detailsTrigger.dataset.id);
      return;
    }

    const toggleButton = e.target.closest('.card-actions-toggle');
    if (toggleButton) {
      const dropdown = toggleButton.nextElementSibling;
      dropdown.classList.toggle('visible');
      return;
    }

    const archiveButton = e.target.closest('.archive-btn');
    if (archiveButton) {
      showArchiveConfirm(archiveButton.dataset.id);
      return;
    }

    const pinButton = e.target.closest('.pin-btn');
    if (pinButton) {
      const shouldPin = pinButton.dataset.pin === 'true';
      handlePinToggle(pinButton.dataset.id, shouldPin);
      return;
    }
  });
// --- ADD THIS NEW LISTENER BLOCK ---
    pinnedIssuesContainer.addEventListener('click', (e) => {
      // Handle clicks for details, menu toggles, and pin/unpin actions
      const detailsTrigger = e.target.closest('.details-btn, .card-body.clickable');
      if (detailsTrigger) {
        handleViewDetails(detailsTrigger.dataset.id);
        return;
      }
      const toggleButton = e.target.closest('.card-actions-toggle');
      if (toggleButton) {
        const dropdown = toggleButton.nextElementSibling;
        dropdown.classList.toggle('visible');
        return;
      }
      const pinButton = e.target.closest('.pin-btn');
      if (pinButton) {
        const shouldPin = pinButton.dataset.pin === 'true';
        handlePinToggle(pinButton.dataset.id, shouldPin);
        return;
      }
      const archiveButton = e.target.closest('.archive-btn');
      if (archiveButton) {
        showArchiveConfirm(archiveButton.dataset.id);
        return;
      }
    });

  archivedIssuesContainer.addEventListener('click', (e) => {
    const detailsTrigger = e.target.closest('.details-btn, .card-body.clickable');
    if (detailsTrigger) {
      handleViewDetails(detailsTrigger.dataset.id);
      return;
    }
    const toggleButton = e.target.closest('.card-actions-toggle');
    if (toggleButton) {
      const dropdown = toggleButton.nextElementSibling;
      dropdown.classList.toggle('visible');
      return;
    }
    const unarchiveButton = e.target.closest('.unarchive-btn');
    if (unarchiveButton) {
      handleStatusChange(unarchiveButton.dataset.id, 'New');
      return;
    }
  });

  issuesContainer.addEventListener('change', (e) => {
    if (e.target && e.target.classList.contains('status-select-card')) {
      const issueId = e.target.dataset.id;
      const newStatus = e.target.value;
      handleStatusChange(issueId, newStatus);
    }
  });

  document.querySelectorAll('.close-button').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').style.display = 'none';
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
    if (!e.target.closest('.card-actions-menu')) {
      document.querySelectorAll('.card-actions-dropdown.visible').forEach(menu => {
        menu.classList.remove('visible');
      });
    }
  });
  
  confirmNoBtn.addEventListener('click', () => confirmModal.style.display = 'none');

  logNewIssueBtn.addEventListener('click', () => {
    issueForm.reset();
    formModal.style.display = 'block';
  });

  issueForm.addEventListener('submit', handleFormSubmit);

  const allFiltersAndSort = [searchBar, sortSelect, filterStatusSelect, filterPrioritySelect, filterSubmitterSelect, filterCategorySelect];
  allFiltersAndSort.forEach(el => el.addEventListener('input', applyFiltersAndSort));
  
  const searchResetBtn = document.getElementById('refresh-btn');
  searchResetBtn.addEventListener('click', () => {
    searchBar.value = '';
    applyFiltersAndSort();
  });

  resetFiltersBtn.addEventListener('click', () => {
    filterStatusSelect.value = 'all';
    filterPrioritySelect.value = 'all';
    filterSubmitterSelect.value = 'all';
    filterCategorySelect.value = 'all';
    searchBar.value = '';
    applyFiltersAndSort();
  });

  logoutBtn.addEventListener('click', handleLogout);

  archivedHeader.addEventListener('click', () => {
    const isExpanded = archivedSection.classList.toggle('expanded');
    archivedHeader.querySelector('.archived-toggle').textContent = isExpanded ? 'Hide' : 'Show';
  });
}

/**
 * The main entry point for the authenticated part of the app.
 */
function startApp() {
  console.log(`Starting app for user: ${loggedInPerson.name}`);
  listenForIssues();
  setupEventListeners();
  populateCategoryDropdown();
  populateFilterDropdowns();
}

/**
 * Handles the user selecting their name from the login screen.
 */
function handlePersonSelect(personName) {
  loggedInPerson = { name: personName };
  localStorage.setItem('loggedInUser', JSON.stringify(loggedInPerson));
  userNameDisplay.textContent = `Logged in as: ${loggedInPerson.name}`;
  loginScreen.style.display = 'none';
  mainAppContainer.style.display = 'block';
  startApp();
}

/**
 * Fetches people from Firestore and displays them on the login screen.
 */
async function showLoginScreen() {
  console.log("Showing login screen and fetching people...");
  try {
    const peopleQuery = query(collection(db, "people"), orderBy("name"));
    const querySnapshot = await getDocs(peopleQuery);

    if (querySnapshot.empty) {
      peopleListContainer.innerHTML = '<p class="placeholder-text-small error">No people found in the database.</p>';
      return;
    }

    let peopleHtml = '';
    querySnapshot.forEach((doc) => {
      const personName = doc.data().name;
      peopleHtml += `<button class="person-button" data-name="${personName}">${personName}</button>`;
    });
    peopleListContainer.innerHTML = peopleHtml;

    peopleListContainer.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('person-button')) {
        const selectedName = e.target.dataset.name;
        handlePersonSelect(selectedName);
      }
    });

  } catch (error) {
    console.error("Error fetching people for login:", error);
    peopleListContainer.innerHTML = '<p class="placeholder-text-small error">Could not load names. Please refresh.</p>';
  }
}

/**
 * Initializes the entire application. Checks for a logged-in user first.
 */
function initializeApp() {
  console.log("App initialized. Checking for user session...");
  logoutBtn.innerHTML = logoutIconSVG;

  onAuthStateChanged(auth, user => {
    if (user) {
      firebaseUser = user;
      console.log("Firebase anonymous user is signed in:", user.uid);

      const savedUser = localStorage.getItem('loggedInUser');
      if (savedUser) {
        loggedInPerson = JSON.parse(savedUser);
        userNameDisplay.textContent = `Logged in as: ${loggedInPerson.name}`;
        loginScreen.style.display = 'none';
        mainAppContainer.style.display = 'block';
        startApp();
      } else {
        showLoginScreen();
      }

    } else {
      console.log("User is not signed in. Attempting anonymous sign-in...");
      signInAnonymously(auth).catch(error => {
        console.error("Anonymous sign-in failed:", error);
        document.body.innerHTML = '<p class="placeholder-text error">Fatal Error: Could not authenticate.</p>';
      });
    }
  });
}

// We need a new function to populate the filter dropdowns, separate from the form dropdowns
async function populateFilterDropdowns() {
  try {
    const peopleQuery = query(collection(db, "people"), orderBy("name"));
    const peopleSnapshot = await getDocs(peopleQuery);
    let peopleOptions = '<option value="all">All</option>';
    peopleSnapshot.forEach(doc => {
      const name = doc.data().name;
      peopleOptions += `<option value="${name}">${name}</option>`;
    });
    filterSubmitterSelect.innerHTML = peopleOptions;
  } catch (error) {
    console.error("Error populating filter dropdowns:", error);
  }
}

// =================================================================
//  START THE APP
// =================================================================
initializeApp();