const storage = new TabStorage();
let activeTagFilters = new Set();

// DOM Elements
const saveCurrentTabBtn = document.getElementById('saveCurrentTab');
const searchInput = document.getElementById('searchInput');
const tagFilter = document.getElementById('tagFilter');
const tabsList = document.getElementById('tabsList');
const addTabModal = document.getElementById('addTabModal');
const addTabForm = document.getElementById('addTabForm');
const cancelAddBtn = document.getElementById('cancelAdd');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await refreshTabsList();
  await updateTagFilters();
});

// Event Listeners
saveCurrentTabBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  showAddTabModal(tab);
});

searchInput.addEventListener('input', debounce(refreshTabsList, 300));

cancelAddBtn.addEventListener('click', () => {
  addTabModal.style.display = 'none';
});

addTabForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(addTabForm);
  const tabData = {
    title: formData.get('tabTitle'),
    url: formData.get('tabUrl'),
    tags: formData.get('tabTags').split(',').map(tag => tag.trim()).filter(Boolean)
  };
  
  await storage.saveTab(tabData);
  addTabModal.style.display = 'none';
  await refreshTabsList();
  await updateTagFilters();
});

// Functions
async function refreshTabsList() {
  const query = searchInput.value;
  const tabs = await storage.searchTabs(query, Array.from(activeTagFilters));
  
  tabsList.innerHTML = tabs.map(tab => `
    <div class="tab-item" data-id="${tab.id}">
      <div class="tab-header">
        <a href="${tab.url}" class="tab-title" target="_blank">${tab.title}</a>
        <div class="tab-actions">
          <button class="btn secondary edit-tab" data-id="${tab.id}">Edit</button>
          <button class="btn secondary delete-tab" data-id="${tab.id}">Delete</button>
        </div>
      </div>
      <div class="tab-tags">
        ${tab.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </div>
  `).join('');

  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.edit-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      editTab(id);
    });
  });

  document.querySelectorAll('.delete-tab').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = parseInt(e.target.dataset.id);
      if (confirm('Are you sure you want to delete this tab?')) {
        await storage.deleteTab(id);
        await refreshTabsList();
        await updateTagFilters();
      }
    });
  });
}

async function updateTagFilters() {
  const tags = await storage.getAllTags();
  
  tagFilter.innerHTML = tags.map(tag => `
    <span class="tag ${activeTagFilters.has(tag) ? 'active' : ''}" data-tag="${tag}">
      ${tag}
    </span>
  `).join('');

  document.querySelectorAll('.tag').forEach(tagElement => {
    tagElement.addEventListener('click', (e) => {
      const tag = e.target.dataset.tag;
      if (activeTagFilters.has(tag)) {
        activeTagFilters.delete(tag);
        e.target.classList.remove('active');
      } else {
        activeTagFilters.add(tag);
        e.target.classList.add('active');
      }
      refreshTabsList();
    });
  });
}

function showAddTabModal(tab = null) {
  const titleInput = document.getElementById('tabTitle');
  const urlInput = document.getElementById('tabUrl');
  const tagsInput = document.getElementById('tabTags');

  if (tab) {
    titleInput.value = tab.title || '';
    urlInput.value = tab.url || '';
    tagsInput.value = '';
  } else {
    titleInput.value = '';
    urlInput.value = '';
    tagsInput.value = '';
  }

  addTabModal.style.display = 'block';
}

async function editTab(id) {
  const tabs = await storage.getAllTabs();
  const tab = tabs.find(t => t.id === id);
  
  if (tab) {
    const titleInput = document.getElementById('tabTitle');
    const urlInput = document.getElementById('tabUrl');
    const tagsInput = document.getElementById('tabTags');

    titleInput.value = tab.title;
    urlInput.value = tab.url;
    tagsInput.value = tab.tags.join(', ');

    addTabForm.onsubmit = async (e) => {
      e.preventDefault();
      
      const updatedTab = {
        title: titleInput.value,
        url: urlInput.value,
        tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean)
      };
      
      await storage.updateTab(id, updatedTab);
      addTabModal.style.display = 'none';
      await refreshTabsList();
      await updateTagFilters();
      
      // Reset form submit handler
      addTabForm.onsubmit = null;
    };

    addTabModal.style.display = 'block';
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}