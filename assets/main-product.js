if (!customElements.get('product-form')) {
  class ProductForm extends HTMLElement {
    connectedCallback() {
      const productJson = this.querySelector('[data-product-json]');
      this.product = productJson ? JSON.parse(productJson.textContent) : null;

      this.mainImage = this.querySelector('[data-main-image]');
      this.priceValueEl = this.querySelector('[data-price-value]');
      this.comparePriceEl = this.querySelector('[data-compare-price]');
      this.addToCartButton = this.querySelector('[data-add-to-cart]');
      this.addToCartText = this.querySelector('[data-add-to-cart-text]');
      this.quantityInput = this.querySelector('[data-quantity-input]');

      this.querySelectorAll('[data-thumbnail]').forEach((thumbnail) => {
        thumbnail.addEventListener('click', () => this.onThumbnailClick(thumbnail));
      });

      this.querySelectorAll('[data-option-index]').forEach((select) => {
        select.addEventListener('change', () => this.onVariantChange());
      });

      const decrease = this.querySelector('[data-quantity-decrease]');
      const increase = this.querySelector('[data-quantity-increase]');
      if (decrease) decrease.addEventListener('click', () => this.stepQuantity(-1));
      if (increase) increase.addEventListener('click', () => this.stepQuantity(1));

      if (this.addToCartButton) {
        this.addToCartButton.addEventListener('click', () => this.onAddToCart());
      }
    }

    formatMoney(cents) {
      return (cents / 100).toLocaleString(undefined, {
        style: 'currency',
        currency: this.dataset.shopCurrency || 'USD',
        currencyDisplay: 'narrowSymbol',
      });
    }

    stepQuantity(delta) {
      if (!this.quantityInput) return;
      const next = Math.max(1, parseInt(this.quantityInput.value || '1', 10) + delta);
      this.quantityInput.value = next;
    }

    onThumbnailClick(thumbnail) {
      this.querySelectorAll('[data-thumbnail]').forEach((el) => el.classList.remove('is-active'));
      thumbnail.classList.add('is-active');

      const media = this.product?.media?.find((m) => String(m.id) === thumbnail.dataset.mediaId);
      if (media) {
        this.setMainImage(media.preview_image.src || media.src);
      }
    }

    setMainImage(src) {
      if (!this.mainImage || !src) return;
      const img = this.mainImage.querySelector('img');
      if (!img) return;

      this.mainImage.classList.add('is-loading');

      const preload = new Image();
      preload.onload = () => {
        img.src = src;
        img.srcset = '';
        this.mainImage.classList.remove('is-loading');
      };
      preload.onerror = () => {
        this.mainImage.classList.remove('is-loading');
      };
      preload.src = src;
    }

    findVariant() {
      if (!this.product) return null;
      const selects = [...this.querySelectorAll('[data-option-index]')];
      const selected = selects.map((select) => select.value);

      return this.product.variants.find((variant) => {
        const options = [variant.option1, variant.option2, variant.option3];
        return selected.every((value, index) => options[index] === value || value === undefined);
      });
    }

    onVariantChange() {
      const variant = this.findVariant();
      if (!variant) return;

      if (this.priceValueEl) {
        this.priceValueEl.textContent = this.formatMoney(variant.price);
      }
      if (this.comparePriceEl) {
        this.comparePriceEl.hidden = !(variant.compare_at_price > variant.price);
        if (variant.compare_at_price > variant.price) {
          this.comparePriceEl.textContent = this.formatMoney(variant.compare_at_price);
        }
      }

      if (this.addToCartButton) {
        this.addToCartButton.dataset.variantId = variant.id;
        this.addToCartButton.disabled = !variant.available;
        if (this.addToCartText) {
          this.addToCartText.textContent = variant.available
            ? this.addToCartButton.dataset.addLabel
            : this.addToCartButton.dataset.soldOutLabel;
        }
      }

      if (variant.featured_media) {
        this.setMainImage(variant.featured_media.preview_image.src);
      }

      if (this.dataset.productUrl) {
        const url = `${this.dataset.productUrl}?variant=${variant.id}`;
        window.history.replaceState({}, '', url);
      }
    }

    async onAddToCart() {
      if (this.addToCartButton.disabled) return;
      const quantity = this.quantityInput ? parseInt(this.quantityInput.value || '1', 10) : 1;
      const originalText = this.addToCartText.textContent;
      this.addToCartButton.disabled = true;
      this.addToCartText.textContent = this.addToCartButton.dataset.addingLabel;

      try {
        const response = await fetch(this.addToCartButton.dataset.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: this.addToCartButton.dataset.variantId,
            quantity,
            sections: 'cart-drawer',
          }),
        });

        if (!response.ok) throw new Error('Add to cart failed');

        const result = await response.json();
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: result }));

        this.addToCartButton.disabled = false;
        this.addToCartText.textContent = originalText;
      } catch (error) {
        this.addToCartButton.disabled = false;
        this.addToCartText.textContent = originalText;
      }
    }
  }

  customElements.define('product-form', ProductForm);
}
