// =================================================================
//  IMPORTS
// =================================================================
import { onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, onSnapshot, doc, getDoc, addDoc, serverTimestamp, getDocs, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from './firebase-init.js';

// =================================================================
//  DOM ELEMENT CACHING
// =================================================================
const issuesContainer = document.getElementById('issues-container');
const detailsModal = document.getElementById('details-modal');
const detailsTitle = document.getElementById('details-title');
const detailsContent = document.getElementById('details-content');
const logNewIssueBtn = document.getElementById('log-new-issue-btn');
const formModal = document.getElementById('form-modal');
const issueForm = document.getElementById('issue-form');
const submitBtn = document.getElementById('submit-btn');
const categorySelect = document.getElementById('category');
const loginScreen = document.getElementById('login-screen');
const mainAppContainer = document.getElementById('main-app-container');
const peopleListContainer = document.getElementById('people-list-container');
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');
const userDisplayContainer = document.getElementById('user-display');
const userNameDisplay = document.getElementById('user-name-display');
const logoutBtn = document.getElementById('logout-btn');
logoutBtn.innerHTML = logoutIconSVG;
// Filter and Sort Controls
const searchBar = document.getElementById('search-bar');
const filterCategorySelect = document.getElementById('filter-category-select');
const filterStatusSelect = document.getElementById('filter-status-select');
const filterPrioritySelect = document.getElementById('filter-priority-select');
const filterSubmitterSelect = document.getElementById('filter-submitter-select');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const sortSelect = document.getElementById('sort-select');

// =================================================================
//  CONSTANTS & ICONS
// =================================================================
const STATUS_OPTIONS = ['New', 'In Progress', 'Resolved'];
const dotsIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>';
const archiveButtonSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 1a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1H.5zM1 2.5v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-11H1zm2 3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 1 .5-.5z" /></svg>';
const logoutIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/><path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/></svg>';

// =================================================================
//  STATE
// =================================================================
let firebaseUser = null; // For the anonymous auth user from Firebase
let loggedInPerson = null; // For the user profile from 'people' collection
let allIssues = []; // Master list of all issues from Firestore

// =================================================================
//  CORE APPLICATION LOGIC
// =================================================================

/**
 * Shows the confirmation modal for archiving an issue.
 * @param {string} issueId - The ID of the issue to archive.
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
 * Logs the user out by clearing localStorage and reloading the page.
 */
function handleLogout() {
  localStorage.removeItem('loggedInUser');
  location.reload(); // The simplest way to reset the app state
}

/**
 * Updates an issue's status in Firestore.
 * @param {string} issueId - The ID of the issue to update.
 * @param {string} newStatus - The new status value.
 */
async function handleStatusChange(issueId, newStatus) {
  console.log(`Updating status for ${issueId} to ${newStatus}`);
  const docRef = doc(db, "issues", issueId);
  try {
    await updateDoc(docRef, {
      status: newStatus
    });
    console.log("Status updated successfully!");
  } catch (error) {
    console.error("Error updating status:", error);
    alert("Failed to update status. Please try again.");
  }
}

/**
 * Fetches categories from Firestore and populates the dropdowns.
 */
async function populateCategoryDropdown() {
  console.log("Fetching categories...");
  try {
    const querySnapshot = await getDocs(collection(db, "categories"));
    let formOptionsHtml = '<option value="" disabled selected>Select a Category</option>';
    let filterOptionsHtml = '<option value="all">All</option>'; // Start with 'All' for the filter
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
  if (!currentUser) {
    alert("You must be logged in to submit an issue.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const formData = new FormData(issueForm);
    const newIssue = {
      title: formData.get('title'),
      category: formData.get('category'),
      type: formData.get('type'),
      priority: formData.get('priority'),
      description: formData.get('description'),
      submitterId: currentUser.uid,
      submitterName: loggedInPerson.name,
      status: "New",
      isPinned: false,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "issues"), newIssue);

    console.log("New issue submitted successfully!");
    issueForm.reset();
    formModal.style.display = 'none';

  } catch (error) {
    console.error("Error submitting new issue:", error);
    alert("There was an error submitting your issue. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Issue';
  }
}

/**
 * Populates the details modal with issue data and displays it.
 */
function populateAndShowDetailsModal(issue) {
  detailsTitle.textContent = `Issue: ${issue.title || 'No Title'}`;

  const detailsHtml = `
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
  `;
  detailsContent.innerHTML = detailsHtml;
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
      populateAndShowDetailsModal(docSnap.data());
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
 * Takes an array of issues and renders them to the page.
 */
function renderIssues(issuesToDisplay) {
  if (issuesToDisplay.length === 0) {
    issuesContainer.innerHTML = '<p class="placeholder-text">No issues match the current filters.</p>';
    return;
  }

  let issuesHtml = '';
  issuesToDisplay.forEach(issue => {
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

    const cardMenu = `
      <div class="card-actions-menu">
        <button class="card-actions-toggle">${dotsIconSVG}</button>
        <div class="card-actions-dropdown">
          <button class="archive-btn" data-id="${issueId}">${archiveButtonSVG} Archive</button>
        </div>
      </div>
    `;

    const archivedClass = status === 'Archived' ? 'status-archived' : '';

    issuesHtml += `
      <div class="issue-card priority-${priority.toLowerCase()} ${archivedClass}">
        <div class="card-header">
          <h3 class="card-title">${issue.title || 'No Title'}</h3>
          <div class="card-header-right">
            <span class="priority-tag priority-${priority.toLowerCase()}">${priority}</span>
            ${statusDropdown}
            ${status !== 'Archived' ? cardMenu : ''}
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
              <button class="button-secondary button-small details-btn" data-id="${issueId}">View Details</button>
          </div>
        </div>
      </div>
    `;
  });
  issuesContainer.innerHTML = issuesHtml;
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
  logoutBtn.addEventListener('click', handleLogout);

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
}

/**
 * The main entry point for the authenticated part of the app.
 */
function startApp() {
  console.log(`Starting app for user: ${loggedInPerson.name}`);
  listenForIssues();
  setupEventListeners();
  populateCategoryDropdown();
  // We now populate the filter dropdown from the main people list
  populateFilterDropdowns(); 
}

/**
 * Handles the user selecting their name from the login screen.
 * @param {string} personName - The name of the person selected.
 */
function handlePersonSelect(personName) {
  loggedInPerson = { name: personName };
  // Store the selected person's info in localStorage for future visits
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