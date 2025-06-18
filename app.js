(() => {
    "use strict";

const DEFAULT_CITIES = [
   { id: 'new_york', label: 'New York, USA', timezone: 'America/New_York' },
   { id: 'london', label: 'London, UK', timezone: 'Europe/London' },
   { id: 'tokyo', label: 'Tokyo, Japan', timezone: 'Asia/Tokyo' },
   { id: 'sydney', label: 'Sydney, Australia', timezone: 'Australia/Sydney' },
   { id: 'moscow', label: 'Moscow, Russia', timezone: 'Europe/Moscow' },
   { id: 'delhi', label: 'Delhi, India', timezone: 'Asia/Kolkata' },
   { id: 'rio', label: 'Rio de Janeiro, Brazil', timezone: 'America/Sao_Paulo' },
    ];

    let savedCities = [];
    const localStorageKey = 'world_clock_selected_cities';
    const themeKey = 'world_clock_theme';

    const mainContent = document.getElementById('mainContent');
    const citiesList = document.getElementById('citiesList');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');

    // Internationalization for date, time formatting for clocks
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'short' };
    const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };

    // Accessibility helper: trap focus inside sidebar when open on mobile
    function trapFocus(element) {
      const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';
      const firstFocusableElement = element.querySelectorAll(focusableElementsString)[0];
      const focusableElements = element.querySelectorAll(focusableElementsString);
      const lastFocusableElement = focusableElements[focusableElements.length - 1];

      function handleFocus(event) {
        if (event.key !== 'Tab') return;

        if (event.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            event.preventDefault();
            lastFocusableElement.focus();
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            event.preventDefault();
            firstFocusableElement.focus();
          }
        }
      }
      element.addEventListener('keydown', handleFocus);

      // Cleanup function to remove event listener on close
      return () => element.removeEventListener('keydown', handleFocus);
    }

    // Load saved cities or use default
    function loadCities() {
      try {
        const stored = localStorage.getItem(localStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            savedCities = parsed;
            return;
          }
        }
      } catch (e) {
        console.error("Failed to parse saved cities from localStorage", e);
      }
      savedCities = DEFAULT_CITIES;
    }

    // Save cities to localStorage
    function saveCities() {
      localStorage.setItem(localStorageKey, JSON.stringify(savedCities));
    }

    // Helper to format time for city clock
    function formatTime(date, timezone) {
      return date.toLocaleTimeString(undefined, { ...timeOptions, timeZone: timezone });
    }
    function formatDate(date, timezone) {
      return date.toLocaleDateString(undefined, { ...dateOptions, timeZone: timezone });
    }

    // Create city list button
    function createCityListItem(city) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'city-item';
      button.textContent = city.label;

      // Notification badge with local time zone offset difference in hours compared to selected city
      button.setAttribute('aria-pressed', 'true');
      button.title = `Remove ${city.label} from your selection`;
      button.addEventListener('click', () => {
        removeCity(city.id);
      });
      return button;
    }

    // Render city list sidebar
    function renderCityList() {
      citiesList.innerHTML = '';
      savedCities.forEach(city => {
        const btn = createCityListItem(city);
        citiesList.appendChild(btn);
      });
    }
    
    // Render clock cards main area
    function renderClocks() {
      mainContent.innerHTML = '';
      if(savedCities.length === 0) {
        const noCityMsg = document.createElement('p');
        noCityMsg.textContent = "No cities selected. Use the sidebar to add cities.";
        noCityMsg.style.color = 'var(--color-primary-light)';
        noCityMsg.style.textAlign = 'center';
        noCityMsg.style.fontWeight = '600';
        noCityMsg.style.fontSize = '1.2rem';
        mainContent.appendChild(noCityMsg);
        return;
      }
      savedCities.forEach(city => {
        const card = document.createElement('article');
        card.className = 'clock-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'region');
        card.setAttribute('aria-label', `Current time in ${city.label}`);

        const cityName = document.createElement('h2');
        cityName.className = 'city-name';
        cityName.textContent = city.label;

        const clockTime = document.createElement('time');
        clockTime.className = 'clock-time';
        clockTime.setAttribute('datetime', '');
        clockTime.textContent = '--:--:--';

        const clockDate = document.createElement('div');
        clockDate.className = 'clock-date';
        clockDate.textContent = 'Loading...';

        card.appendChild(cityName);
        card.appendChild(clockTime);
        card.appendChild(clockDate);
        mainContent.appendChild(card);

        city._el = { card, clockTime, clockDate };
      });
    }

    // Update clock times every second
    function updateClocks() {
      const now = new Date();
      savedCities.forEach(city => {
        if (!city._el) return;
        const timeStr = formatTime(now, city.timezone);
        const dateStr = formatDate(now, city.timezone);
        city._el.clockTime.textContent = timeStr;
        city._el.clockTime.setAttribute('datetime', now.toISOString());
        city._el.clockDate.textContent = dateStr;
      });
    }

    // Remove a city from savedCities
    function removeCity(cityId) {
      savedCities = savedCities.filter(c => c.id !== cityId);
      saveCities();
      renderCityList();
      renderClocks();
      updateClocks();
    }

    // Add city - show dialog to select from all cities except saved
    function addCity() {
      // Create modal dialog for city addition
      if(document.getElementById('addCityModal')) {
        return; // avoid multiple modals
      }
      const modal = document.createElement('dialog');
      modal.id = 'addCityModal';
      modal.style.padding = '0';
      modal.style.borderRadius = '16px';
      modal.style.border = 'none';
      modal.style.width = '320px';
      modal.style.maxWidth = '90vw';
      modal.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
      modal.setAttribute('aria-label', 'Add city dialog');

      const header = document.createElement('header');
      header.style.padding = '16px 24px';
      header.style.background = 'var(--color-primary-light)';
      header.style.color = 'var(--color-bg)';
      header.style.fontWeight = '700';
      header.style.fontSize = '1.25rem';
      header.textContent = 'Add a city';

      const form = document.createElement('form');
      form.method = 'dialog';
      form.style.padding = '16px 24px';

      const select = document.createElement('select');
      select.name = 'citySelect';
      select.style.width = '100%';
      select.style.fontSize = '1rem';
      select.style.padding = '12px';
      select.style.borderRadius = '8px';
      select.style.border = '1px solid var(--color-primary-light)';
      select.setAttribute('aria-label', 'Select city to add');
      select.required = true;

      // Populate selectable cities, excluding saved
      let availableCities = DEFAULT_CITIES.filter(dc =>
        !savedCities.some(sc => sc.id === dc.id)
      );

      availableCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.label;
        select.appendChild(option);
      });

      const buttonsDiv = document.createElement('div');
      buttonsDiv.style.marginTop = '24px';
      buttonsDiv.style.textAlign = 'right';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.marginRight = '12px';
      cancelBtn.addEventListener('click', () => {
        modal.close();
      });

      const addBtn = document.createElement('button');
      addBtn.type = 'submit';
      addBtn.textContent = 'Add';
      addBtn.style.background = 'var(--color-primary-light)';
      addBtn.style.color = 'var(--color-bg)';
      addBtn.style.border = 'none';
      addBtn.style.borderRadius = '8px';
      addBtn.style.padding = '10px 24px';
      addBtn.style.cursor = 'pointer';

      buttonsDiv.appendChild(cancelBtn);
      buttonsDiv.appendChild(addBtn);

      form.appendChild(select);
      form.appendChild(buttonsDiv);

      form.addEventListener('submit', e => {
        e.preventDefault();
        const selectedId = select.value;
        if (!selectedId) return;
        const cityToAdd = DEFAULT_CITIES.find(c => c.id === selectedId);
        if (cityToAdd) {
          savedCities.push(cityToAdd);
          saveCities();
          renderCityList();
          renderClocks();
          updateClocks();
          modal.close();
        }
      });

      modal.appendChild(header);
      modal.appendChild(form);
      document.body.appendChild(modal);

      modal.showModal();
      select.focus();

      // Close on outside click or Escape
      modal.addEventListener('click', (e) => {
        const rect = modal.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right ||
            e.clientY < rect.top  || e.clientY > rect.bottom) {
          modal.close();
        }
      });
      modal.addEventListener('cancel', () => {
        modal.close();
      });
      modal.addEventListener('close', () => {
        modal.remove();
      });
    }
    
    // Theme handling
    function loadTheme() {
      const saved = localStorage.getItem(themeKey);
      if (saved === 'light' || saved === 'dark') {
        document.documentElement.setAttribute('data-theme', saved);
        updateThemeIcon(saved);
      } else {
        // Detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        updateThemeIcon(prefersDark ? 'dark' : 'light');
      }
    }
    function saveTheme(theme) {
      localStorage.setItem(themeKey, theme);
    }
    function toggleTheme() {
      const currTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      saveTheme(newTheme);
      updateThemeIcon(newTheme);
    }
    function updateThemeIcon(theme) {
      if(theme === 'dark') {
        themeIcon.textContent = 'dark_mode';
        themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
        themeToggleBtn.title = 'Switch to light mode';
      } else {
        themeIcon.textContent = 'light_mode';
        themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
        themeToggleBtn.title = 'Switch to dark mode';
      }
    }

    // Keyboard shortcuts for toggle theme and sidebar toggle
    function keyboardShortcuts(e) {
      if(e.altKey && e.key === 't') { // Alt+T toggles theme
        e.preventDefault();
        toggleTheme();
      } else if(e.altKey && e.key === 'm') { // Alt+M toggles sidebar menu on mobile
        e.preventDefault();
        toggleSidebar();
      }
    }

    // Sidebar toggle on mobile
    function toggleSidebar() {
      if (sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
        sidebarToggle.setAttribute('aria-expanded', 'false');
        sidebarToggle.focus();
      } else {
        sidebar.classList.add('show');
        sidebar.setAttribute('tabindex', '-1');
        sidebar.focus();
        sidebarToggle.setAttribute('aria-expanded', 'true');
      }
    }

    // Set up add city button as last city item in sidebar
    function setupAddCityButton() {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'city-item';
      addBtn.textContent = '+ Add City';
      addBtn.title = 'Add a new city';
      addBtn.style.color = 'var(--color-primary-dark)';
      addBtn.style.fontWeight = '800';
      addBtn.style.borderTop = '1px solid rgba(255 255 255 / 0.1)';
      addBtn.style.marginTop = '12px';
      addBtn.style.cursor = 'pointer';

      addBtn.addEventListener('click', () => {
        addCity();
      });
      citiesList.appendChild(addBtn);
    }

    function init() {
      loadTheme();
      loadCities();
      renderCityList();
      setupAddCityButton();
      renderClocks();
      updateClocks();
      // Update clock times every second
      setInterval(updateClocks, 1000);

      themeToggleBtn.addEventListener('click', toggleTheme);
      sidebarToggle.addEventListener('click', toggleSidebar);

      window.addEventListener('keydown', keyboardShortcuts);

      // Close sidebar on resize to desktop
      window.addEventListener('resize', () => {
        if(window.innerWidth >= 768) {
          sidebar.classList.remove('show');
          sidebarToggle.setAttribute('aria-expanded', 'false');
        }
      });

      // Save preference for smooth scrolling
      document.documentElement.style.scrollBehavior = "smooth";
    }

    window.addEventListener('load', init);
})();