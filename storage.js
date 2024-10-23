class TabStorage {
  constructor() {
    this.storageKey = 'savedTabs';
  }

  async getAllTabs() {
    const result = await chrome.storage.local.get(this.storageKey);
    return result[this.storageKey] || [];
  }

  async saveTab(tab) {
    const tabs = await this.getAllTabs();
    const newTab = {
      id: Date.now(),
      title: tab.title,
      url: tab.url,
      tags: tab.tags,
      createdAt: new Date().toISOString()
    };
    
    tabs.push(newTab);
    await chrome.storage.local.set({ [this.storageKey]: tabs });
    return newTab;
  }

  async updateTab(id, updatedTab) {
    const tabs = await this.getAllTabs();
    const index = tabs.findIndex(tab => tab.id === id);
    
    if (index !== -1) {
      tabs[index] = { ...tabs[index], ...updatedTab };
      await chrome.storage.local.set({ [this.storageKey]: tabs });
      return tabs[index];
    }
    return null;
  }

  async deleteTab(id) {
    const tabs = await this.getAllTabs();
    const filteredTabs = tabs.filter(tab => tab.id !== id);
    await chrome.storage.local.set({ [this.storageKey]: filteredTabs });
  }

  async searchTabs(query, tags = []) {
    const tabs = await this.getAllTabs();
    return tabs.filter(tab => {
      const matchesQuery = !query || 
        tab.title.toLowerCase().includes(query.toLowerCase()) ||
        tab.url.toLowerCase().includes(query.toLowerCase());
      
      const matchesTags = tags.length === 0 || 
        tags.every(tag => tab.tags.includes(tag));
      
      return matchesQuery && matchesTags;
    });
  }

  async getAllTags() {
    const tabs = await this.getAllTabs();
    const tagSet = new Set();
    tabs.forEach(tab => {
      tab.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }
}