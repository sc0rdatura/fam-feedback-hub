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
const imageViewerModal = document.getElementById('image-viewer-modal');
const viewerImage = document.getElementById('viewer-image');
const imageCounter = document.getElementById('image-counter');
const prevImageBtn = document.getElementById('prev-image-btn');
const nextImageBtn = document.getElementById('next-image-btn');
const downloadImageBtn = document.getElementById('download-image-btn');
const closeViewerBtn = document.getElementById('close-viewer-btn');

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
let currentImages = [];
let currentImageIndex = 0;
let currentOpenIssue = null;
let currentIssueId = null;
let isEditMode = false;

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
  currentOpenIssue = issue;
  currentIssueId = issueId;
  isEditMode = false;
  
  detailsTitle.textContent = `Issue: ${issue.title || 'No Title'}`;

  // Generate edit buttons
  const actionsContainer = document.getElementById('modal-header-actions');
  actionsContainer.innerHTML = `
    <button id="edit-details-btn" class="button-secondary button-small">Edit Details</button>
    <button id="save-details-btn" class="button-primary button-small" style="display: none;">Save Changes</button>
    <button id="cancel-edit-btn" class="button-secondary button-small" style="display: none;">Cancel</button>
  `;

  // Build screenshots section
  let screenshotsHtml = '';
  if (issue.screenshots && issue.screenshots.length > 0) {
    screenshotsHtml = `
      <div class="screenshots-section">
        <h4>Screenshots (${issue.screenshots.length})</h4>
        <div class="screenshots-grid">
          ${issue.screenshots.map((url, index) => `
            <img src="${url}" alt="Screenshot thumbnail" class="screenshot-thumbnail" data-index="${index}">
          `).join('')}
        </div>
      </div>
    `;
  } else {
    screenshotsHtml = `
      <div class="screenshots-section">
        <h4>Screenshots</h4>
        <p class="placeholder-text-small">No screenshots attached.</p>
      </div>
    `;
  }

  // Build editable details grid
  let detailsHtml = `
    <div class="details-grid">
      <!-- Non-editable fields -->
      <div><strong>Submitter:</strong> ${issue.submitterName || 'Unknown'}</div>
      <div><strong>Date:</strong> ${issue.createdAt ? new Date(issue.createdAt.toDate()).toLocaleString() : 'N/A'}</div>
      
      <!-- Editable: Category -->
      <div class="editable-field">
        <strong>Category:</strong> 
        <span class="field-view">${issue.category || 'N/A'}</span>
        <select class="field-edit" data-field="category" style="display: none;">
          <!-- Options populated when entering edit mode -->
        </select>
      </div>
      
      <!-- Editable: Priority -->
      <div class="editable-field">
        <strong>Priority:</strong> 
        <span class="field-view">${issue.priority || 'Low'}</span>
        <select class="field-edit" data-field="priority" style="display: none;">
          <option value="Low" ${issue.priority === 'Low' ? 'selected' : ''}>Low</option>
          <option value="Medium" ${issue.priority === 'Medium' ? 'selected' : ''}>Medium</option>
          <option value="High" ${issue.priority === 'High' ? 'selected' : ''}>High</option>
          <option value="Critical" ${issue.priority === 'Critical' ? 'selected' : ''}>Critical</option>
        </select>
      </div>
      
      <!-- Editable: Status -->
      <div class="editable-field">
        <strong>Status:</strong> 
        <span class="field-view">${issue.status || 'N/A'}</span>
        <select class="field-edit" data-field="status" style="display: none;">
          <option value="New" ${issue.status === 'New' ? 'selected' : ''}>New</option>
          <option value="In Progress" ${issue.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Resolved" ${issue.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
        </select>
      </div>
      
      <!-- Editable: Type -->
      <div class="editable-field">
        <strong>Type:</strong> 
        <span class="field-view">${issue.type || 'N/A'}</span>
        <select class="field-edit" data-field="type" style="display: none;">
          <option value="Bug" ${issue.type === 'Bug' ? 'selected' : ''}>Bug</option>
          <option value="Feature Request" ${issue.type === 'Feature Request' ? 'selected' : ''}>Feature Request</option>
          <option value="UI/UX Suggestion" ${issue.type === 'UI/UX Suggestion' ? 'selected' : ''}>UI/UX Suggestion</option>
          <option value="Question" ${issue.type === 'Question' ? 'selected' : ''}>Question</option>
          <option value="Other" ${issue.type === 'Other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
    </div>
    <h4>Description</h4>
    <p class="details-description">${issue.description || 'No description provided.'}</p>
    
    ${screenshotsHtml}

    <div class="comments-section">
      <h4>Comments</h4>
      <div id="comments-list"><p class="placeholder-text-small">Loading comments...</p></div>
      <form id="add-comment-form">
        <h4>Add a Comment</h4>
        <div class="form-group">
          <label for="comment-text">Comment</label>
          <textarea id="comment-text" name="commentText" rows="3" required></textarea>
        </div>
        <div class="form-group">
          <label for="comment-screenshot">Attach Screenshot (Optional)</label>
          <input type="file" id="comment-screenshot" name="commentScreenshot" accept="image/*">
        </div>
        <div class="form-actions">
          <button type="submit" id="submit-comment-btn" class="button-primary">Submit Comment</button>
        </div>
      </form>
    </div>
  `;
  
  detailsContent.innerHTML = detailsHtml;

  // Set up comment form submission
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
        ${comment.screenshot ? `
          <div class="comment-screenshot">
            <img src="${comment.screenshot}" alt="Comment screenshot" class="comment-screenshot-img">
          </div>
        ` : ''}
      </div>
    </div>
  `;
    commentsList.innerHTML = commentsHtml;
  }, (error) => {
    console.error("Error fetching comments:", error);
    commentsList.innerHTML = '<p class="placeholder-text-small error">Could not load comments.</p>';
  });
  })
}

async function handleAddComment(issueId, text) {
  const submitBtn = document.getElementById('submit-comment-btn');
  // Correctly get the single file object
  const screenshotFile = document.getElementById('comment-screenshot').files[0]; 
  
  // --- VALIDATION ---
  if (screenshotFile) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(screenshotFile.type)) {
      alert('Invalid file type. Please upload a JPG, PNG, GIF, or WEBP image.');
      return;
    }
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (screenshotFile.size > maxSizeInBytes) {
      alert('File is too large. The maximum size is 5MB.');
      return;
    }
  } // <-- This was likely the missing brace

  submitBtn.disabled = true;

  try {
    let screenshotUrl = null;
    // --- UPLOAD ---
    if (screenshotFile) {
      submitBtn.textContent = 'Uploading Screenshot...';
      screenshotUrl = await uploadScreenshotToCloudinary(screenshotFile);
    }

    submitBtn.textContent = 'Submitting Comment...';
    
    // --- CREATE FIRESTORE DOCUMENT ---
    const issueDocRef = doc(db, 'issues', issueId);
    const commentsCollectionRef = collection(issueDocRef, 'comments');
    
    const newComment = {
      text: text,
      commenterName: loggedInPerson.name,
      createdAt: serverTimestamp()
    };

    if (screenshotUrl) {
      newComment.screenshot = screenshotUrl; // Add screenshot URL if it exists
    }

    await addDoc(commentsCollectionRef, newComment);
    await updateDoc(issueDocRef, { commentCount: increment(1) });

  } catch (error) {
    console.error("Error adding comment: ", error);
    alert(error.message || "Failed to add comment.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Comment';
  }
}


// --- IMAGE VIEWER FUNCTIONS ---

function showImageAtIndex(index) {
  // Update the main image source
  viewerImage.src = currentImages[index];
  
  // Update the counter
  imageCounter.textContent = `${index + 1} / ${currentImages.length}`;
  
  // Show/hide counter and nav buttons based on image count
  const hasMultipleImages = currentImages.length > 1;
  imageCounter.style.display = hasMultipleImages ? 'block' : 'none';
  prevImageBtn.style.display = hasMultipleImages ? 'block' : 'none';
  nextImageBtn.style.display = hasMultipleImages ? 'block' : 'none';

  // Disable/enable buttons at boundaries
  prevImageBtn.disabled = index === 0;
  nextImageBtn.disabled = index === currentImages.length - 1;
}

function openImageViewer(images, startIndex) {
  if (!images || images.length === 0) return;
  
  currentImages = images;
  currentImageIndex = startIndex;
  
  showImageAtIndex(currentImageIndex);
  
  imageViewerModal.classList.add('visible');
}

function closeImageViewer() {
  imageViewerModal.classList.remove('visible');
  currentImages = []; // Clear the state
  viewerImage.src = ''; // Prevent old image flash
}

function navigateImage(direction) {
  const newIndex = currentImageIndex + direction;
  if (newIndex >= 0 && newIndex < currentImages.length) {
    currentImageIndex = newIndex;
    showImageAtIndex(currentImageIndex);
  }
}

async function downloadCurrentImage() {
  try {
    const imageUrl = currentImages[currentImageIndex];
    // Fetch the image as a blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Create a temporary link to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Extract filename from URL or create a generic one
    const filename = imageUrl.split('/').pop().split('?')[0] || `screenshot-${Date.now()}.jpg`;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // Clean up memory
  } catch (error) {
    console.error('Error downloading image:', error);
    alert('Could not download the image.');
  }
}
function closeDetailsModal() {
  // Check if in edit mode
  if (isEditMode) {
    const confirmClose = confirm('You have unsaved changes. Are you sure you want to close?');
    if (!confirmClose) return;
  }
  
  detailsModal.style.display = 'none';
  currentOpenIssue = null;
  currentIssueId = null;
  isEditMode = false;
  
  // Clean up edit buttons
  const actionsContainer = document.getElementById('modal-header-actions');
  if (actionsContainer) actionsContainer.innerHTML = '';
}

/**
 * Toggles between view and edit mode in the details modal
 */
function toggleEditMode(enable) {
  isEditMode = enable;
  
  const editBtn = document.getElementById('edit-details-btn');
  const saveBtn = document.getElementById('save-details-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  
  const viewFields = document.querySelectorAll('.field-view');
  const editFields = document.querySelectorAll('.field-edit');
  
  if (enable) {
    // Enter edit mode
    if (editBtn) editBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'inline-block';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    
    viewFields.forEach(field => field.style.display = 'none');
    editFields.forEach(field => field.style.display = 'inline-block');
    
    // Populate category dropdown
    populateCategoryEditDropdown(currentOpenIssue.category);
  } else {
    // Exit edit mode
    if (editBtn) editBtn.style.display = 'inline-block';
    if (saveBtn) saveBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    viewFields.forEach(field => field.style.display = 'inline');
    editFields.forEach(field => field.style.display = 'none');
  }
}

/**
 * Populates the category dropdown in edit mode
 */
async function populateCategoryEditDropdown(currentCategory) {
  const categorySelect = document.querySelector('[data-field="category"]');
  if (!categorySelect) return;
  
  try {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    let optionsHtml = '';
    querySnapshot.forEach(doc => {
      const categoryName = doc.data().name;
      const selected = categoryName === currentCategory ? 'selected' : '';
      optionsHtml += `<option value="${categoryName}" ${selected}>${categoryName}</option>`;
    });
    categorySelect.innerHTML = optionsHtml;
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

/**
 * Saves changes made in edit mode to Firestore
 */
async function saveDetailsChanges() {
  if (!currentIssueId) return;
  
  const saveBtn = document.getElementById('save-details-btn');
  if (!saveBtn) return;
  
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  
  try {
    // Collect new values from edit fields
    const updates = {};
    document.querySelectorAll('.field-edit').forEach(field => {
      const fieldName = field.dataset.field;
      updates[fieldName] = field.value;
    });
    
    // Update Firestore
    const docRef = doc(db, 'issues', currentIssueId);
    await updateDoc(docRef, updates);
    
    // Optimistic UI update: update the currentOpenIssue object
    Object.assign(currentOpenIssue, updates);
    
    // Update view fields to show new values
    document.querySelectorAll('.field-edit').forEach(field => {
      const fieldName = field.dataset.field;
      const viewField = field.previousElementSibling;
      if (viewField && viewField.classList.contains('field-view')) {
        viewField.textContent = updates[fieldName];
      }
    });
    
    // Exit edit mode
    toggleEditMode(false);
    
    console.log('Details updated successfully!');
  } catch (error) {
    console.error('Error updating details:', error);
    alert('Failed to save changes. Please try again.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
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
    ${(issue.screenshots && issue.screenshots.length > 0) ? `
      <div class="attachment-indicator" title="${issue.screenshots.length} attachment(s)">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0z"/></svg>
        <span>${issue.screenshots.length}</span>
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
  // Listener for main issue cards (non-pinned)
  issuesContainer.addEventListener('click', (e) => {
    const detailsTrigger = e.target.closest('.details-btn, .card-body.clickable');
    if (detailsTrigger) {
      handleViewDetails(detailsTrigger.dataset.id);
      return;
    }
    const toggleButton = e.target.closest('.card-actions-toggle');
    if (toggleButton) {
      toggleButton.nextElementSibling.classList.toggle('visible');
      return;
    }
    const archiveButton = e.target.closest('.archive-btn');
    if (archiveButton) {
      showArchiveConfirm(archiveButton.dataset.id);
      return;
    }
    const pinButton = e.target.closest('.pin-btn');
    if (pinButton) {
      handlePinToggle(pinButton.dataset.id, pinButton.dataset.pin === 'true');
      return;
    }
  });

  // Listener for pinned issue cards
  pinnedIssuesContainer.addEventListener('click', (e) => {
    const detailsTrigger = e.target.closest('.details-btn, .card-body.clickable');
    if (detailsTrigger) {
      handleViewDetails(detailsTrigger.dataset.id);
      return;
    }
    const toggleButton = e.target.closest('.card-actions-toggle');
    if (toggleButton) {
      toggleButton.nextElementSibling.classList.toggle('visible');
      return;
    }
    const pinButton = e.target.closest('.pin-btn');
    if (pinButton) {
      handlePinToggle(pinButton.dataset.id, pinButton.dataset.pin === 'true');
      return;
    }
    const archiveButton = e.target.closest('.archive-btn');
    if (archiveButton) {
      showArchiveConfirm(archiveButton.dataset.id);
      return;
    }
  });

  // Listener for archived issue cards
  archivedIssuesContainer.addEventListener('click', (e) => {
    const detailsTrigger = e.target.closest('.details-btn, .card-body.clickable');
    if (detailsTrigger) {
      handleViewDetails(detailsTrigger.dataset.id);
      return;
    }
    const toggleButton = e.target.closest('.card-actions-toggle');
    if (toggleButton) {
      toggleButton.nextElementSibling.classList.toggle('visible');
      return;
    }
    const unarchiveButton = e.target.closest('.unarchive-btn');
    if (unarchiveButton) {
      handleStatusChange(unarchiveButton.dataset.id, 'New');
      return;
    }
  });

  // Listeners for status changes on cards
  issuesContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('status-select-card')) {
      handleStatusChange(e.target.dataset.id, e.target.value);
    }
  });
  pinnedIssuesContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('status-select-card')) {
      handleStatusChange(e.target.dataset.id, e.target.value);
    }
  });

  // --- MODAL & GLOBAL LISTENERS ---

  // Generic close buttons for any modal
  document.querySelectorAll('.close-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      // Use our dedicated function for the details modal
      if (modal.id === 'details-modal') {
        closeDetailsModal();
      } else {
        modal.style.display = 'none'; // Close other modals normally
      }
    });
  });

  // Backdrop click to close modals
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      if (e.target.id === 'details-modal') {
        closeDetailsModal();
      } else if (e.target.id === 'image-viewer-modal') {
         // This is handled by a separate listener now
      } else {
        e.target.style.display = 'none';
      }
    }
    // Close dropdown menus if clicking outside
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

  // Filters and Sorting
  [searchBar, sortSelect, filterStatusSelect, filterPrioritySelect, filterSubmitterSelect, filterCategorySelect].forEach(el => el.addEventListener('input', applyFiltersAndSort));
  
  document.getElementById('refresh-btn').addEventListener('click', () => {
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

  // --- Image Viewer Listeners ---
  prevImageBtn.addEventListener('click', () => navigateImage(-1));
  nextImageBtn.addEventListener('click', () => navigateImage(1));
  downloadImageBtn.addEventListener('click', downloadCurrentImage);
  closeViewerBtn.addEventListener('click', closeImageViewer);

  imageViewerModal.addEventListener('click', (e) => {
    if (e.target === imageViewerModal) {
      closeImageViewer();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!imageViewerModal.classList.contains('visible')) return;
    if (e.key === 'ArrowRight') nextImageBtn.click();
    else if (e.key === 'ArrowLeft') prevImageBtn.click();
    else if (e.key === 'Escape') closeImageViewer();
  });

  // --- Listener for Thumbnail Clicks (Event Delegation) ---
// --- Listener for Thumbnail Clicks (Event Delegation) ---
detailsModal.addEventListener('click', (e) => {
  // Handle clicks on issue screenshots
  if (e.target.classList.contains('screenshot-thumbnail')) {
    if (currentOpenIssue && currentOpenIssue.screenshots) {
      const startIndex = parseInt(e.target.dataset.index, 10);
      openImageViewer(currentOpenIssue.screenshots, startIndex);
    }
    return;
  }
  
  // Handle clicks on comment screenshots
  if (e.target.classList.contains('comment-screenshot-img')) {
    const screenshotUrl = e.target.src;
    openImageViewer([screenshotUrl], 0);
    return;
  }
  
  // NEW: Handle edit button click
  if (e.target.id === 'edit-details-btn') {
    toggleEditMode(true);
    return;
  }
  
  // NEW: Handle save button click
  if (e.target.id === 'save-details-btn') {
    saveDetailsChanges();
    return;
  }
  
  // NEW: Handle cancel button click
  if (e.target.id === 'cancel-edit-btn') {
    // Revert any changes by restoring original values
    document.querySelectorAll('.field-edit').forEach(field => {
      const fieldName = field.dataset.field;
      // Find the corresponding option and select it
      const options = Array.from(field.options);
      const correctOption = options.find(opt => opt.value === currentOpenIssue[fieldName]);
      if (correctOption) field.value = correctOption.value;
    });
    toggleEditMode(false);
    return;
  }
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