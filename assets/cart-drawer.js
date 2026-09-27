(() => {
  const dialog = document.getElementById('cart-drawer');
  if (!dialog) return;

  const body = document.getElementById('cart-drawer-body');
  const panel = dialog.querySelector('.cart-drawer__panel');
  const changeUrl = dialog.dataset.changeUrl;
  let pendingCloseCleanup = null;

  function updateHeaderCount(count) {
    const countEl = document.querySelector('[data-cart-count]');
    const cartButton = document.querySelector('[data-cart-drawer-open]');
    if (count > 0) {
      if (countEl) {
        countEl.textContent = count;
      } else if (cartButton) {
        const sup = document.createElement('sup');
        sup.setAttribute('data-cart-count', '');
        sup.textContent = count;
        cartButton.prepend(sup);
      }
    } else if (countEl) {
      countEl.remove();
    }
  }

  function renderSection(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newBody = doc.getElementById('cart-drawer-body');
    if (!newBody) return;

    body.innerHTML = newBody.innerHTML;
    updateHeaderCount(parseInt(newBody.dataset.itemCount || '0', 10));
    bindLines();
  }

  function bindLines() {
    body.querySelectorAll('[data-line-item]').forEach(bindLine);
    body.querySelectorAll('[data-drawer-close]').forEach((button) => {
      button.addEventListener('click', closeDrawer);
    });
  }

  function bindLine(line) {
    const input = line.querySelector('[data-quantity-input]');
    const decrease = line.querySelector('[data-quantity-decrease]');
    const increase = line.querySelector('[data-quantity-increase]');
    const remove = line.querySelector('[data-remove-line]');

    let debounceTimer;
    const scheduleUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => updateLine(line, parseInt(input.value || '0', 10)), 300);
    };

    decrease?.addEventListener('click', () => {
      input.value = Math.max(0, parseInt(input.value || '0', 10) - 1);
      scheduleUpdate();
    });
    increase?.addEventListener('click', () => {
      input.value = parseInt(input.value || '0', 10) + 1;
      scheduleUpdate();
    });
    input?.addEventListener('change', scheduleUpdate);
    remove?.addEventListener('click', () => updateLine(line, 0));
  }

  async function updateLine(line, quantity) {
    dialog.setAttribute('data-loading', '');

    try {
      const response = await fetch(changeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: line.dataset.lineKey,
          quantity,
          sections: 'cart-drawer',
        }),
      });

      const result = await response.json();
      if (result.sections && result.sections['cart-drawer']) {
        renderSection(result.sections['cart-drawer']);
      }
    } finally {
      dialog.removeAttribute('data-loading');
    }
  }

  function openDrawer() {
    if (pendingCloseCleanup) {
      pendingCloseCleanup();
      pendingCloseCleanup = null;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    // Force a synchronous style flush so the browser commits the closed
    // (translateX) state before we flip to open, otherwise the very first
    // showModal() paint can skip straight to the end state with no transition.
    panel.getBoundingClientRect();
    dialog.classList.add('is-open');
  }

  function closeDrawer() {
    if (!dialog.open || pendingCloseCleanup) return;
    dialog.classList.remove('is-open');

    const finish = () => {
      panel.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(timer);
      pendingCloseCleanup = null;
      if (dialog.open) dialog.close();
    };
    const onTransitionEnd = (event) => {
      if (event.target !== panel || event.propertyName !== 'transform') return;
      finish();
    };
    const timer = setTimeout(finish, 350);

    pendingCloseCleanup = () => {
      panel.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(timer);
    };
    panel.addEventListener('transitionend', onTransitionEnd);
  }

  document.querySelectorAll('[data-cart-drawer-open]').forEach((button) => {
    button.addEventListener('click', openDrawer);
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDrawer();
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDrawer();
  });

  document.addEventListener('cart:updated', (event) => {
    const sections = event.detail && event.detail.sections;
    if (sections && sections['cart-drawer']) {
      renderSection(sections['cart-drawer']);
    }
    openDrawer();
  });

  bindLines();
})();
