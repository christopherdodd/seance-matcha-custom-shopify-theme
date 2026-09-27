if (!customElements.get('product-quick-add')) {
  class ProductQuickAdd extends HTMLElement {
    connectedCallback() {
      this.button = this.querySelector('button');
      this.button.addEventListener('click', this.onClick.bind(this));
    }

    async onClick() {
      if (this.button.disabled) return;
      const originalText = this.button.textContent;
      this.button.disabled = true;
      this.button.textContent = this.dataset.addingText || 'Adding...';

      try {
        const response = await fetch(this.dataset.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: this.dataset.variantId,
            quantity: 1,
            sections: 'cart-drawer',
          }),
        });

        if (!response.ok) throw new Error('Add to cart failed');

        const result = await response.json();
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: result }));

        this.button.disabled = false;
        this.button.textContent = originalText;
      } catch (error) {
        this.button.disabled = false;
        this.button.textContent = originalText;
      }
    }
  }

  customElements.define('product-quick-add', ProductQuickAdd);
}
