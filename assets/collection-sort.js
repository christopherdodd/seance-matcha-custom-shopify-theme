if (!customElements.get('collection-sort')) {
  class CollectionSort extends HTMLElement {
    connectedCallback() {
      this.select = this.querySelector('[data-sort-select]');
      this.grid = this.querySelector('[data-grid]');
      if (this.select) {
        this.select.addEventListener('change', () => this.update());
      }
    }

    async update() {
      const params = new URLSearchParams(window.location.search);
      params.set('sort_by', this.select.value);

      const requestUrl = `${this.dataset.url}?${params.toString()}&section_id=${this.dataset.sectionId}`;
      const shareUrl = `${this.dataset.url}?${params.toString()}`;

      this.setAttribute('data-loading', '');

      try {
        const response = await fetch(requestUrl);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newGrid = doc.getElementById('main-collection-grid');

        if (newGrid && this.grid) {
          this.grid.innerHTML = newGrid.innerHTML;
        }

        window.history.replaceState({}, '', shareUrl);
      } finally {
        this.removeAttribute('data-loading');
      }
    }
  }

  customElements.define('collection-sort', CollectionSort);
}
