if (!customElements.get('cart-items')) {
  class CartItems extends HTMLElement {
    connectedCallback() {
      this.subtotalEl = this.querySelector('[data-cart-subtotal]');

      this.querySelectorAll('[data-line-item]').forEach((line) => this.bindLine(line));
    }

    bindLine(line) {
      const input = line.querySelector('[data-quantity-input]');
      const decrease = line.querySelector('[data-quantity-decrease]');
      const increase = line.querySelector('[data-quantity-increase]');
      const remove = line.querySelector('[data-remove-line]');

      let debounceTimer;
      const scheduleUpdate = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.updateLine(line, parseInt(input.value || '0', 10)), 300);
      };

      if (decrease) {
        decrease.addEventListener('click', () => {
          input.value = Math.max(0, parseInt(input.value || '0', 10) - 1);
          scheduleUpdate();
        });
      }
      if (increase) {
        increase.addEventListener('click', () => {
          input.value = parseInt(input.value || '0', 10) + 1;
          scheduleUpdate();
        });
      }
      if (input) {
        input.addEventListener('change', scheduleUpdate);
      }
      if (remove) {
        remove.addEventListener('click', () => this.updateLine(line, 0));
      }
    }

    async updateLine(line, quantity) {
      this.setAttribute('data-loading', '');

      try {
        const response = await fetch(this.dataset.changeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: line.dataset.lineKey,
            quantity,
          }),
        });

        const cart = await response.json();

        if (quantity === 0) {
          line.remove();
        }

        if (cart.item_count === 0) {
          window.location.reload();
          return;
        }

        if (this.subtotalEl) {
          this.subtotalEl.textContent = this.formatMoney(cart.total_price);
        }

        const updatedItem = cart.items.find((item) => item.key === line.dataset.lineKey);
        if (updatedItem) {
          const priceEl = line.querySelector('[data-line-price]');
          if (priceEl) priceEl.textContent = this.formatMoney(updatedItem.original_price);
        }
      } finally {
        this.removeAttribute('data-loading');
      }
    }

    formatMoney(cents) {
      return (cents / 100).toLocaleString(undefined, {
        style: 'currency',
        currency: this.dataset.shopCurrency || 'USD',
        currencyDisplay: 'narrowSymbol',
      });
    }
  }

  customElements.define('cart-items', CartItems);
}
