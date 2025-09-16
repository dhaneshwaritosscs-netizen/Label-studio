import { registerAnalytics } from "@humansignal/core";
registerAnalytics();

// Global CSS override for red highlighting - must be first
import "./styles/red-highlight-override.css";

// JavaScript override for red highlighting - ensures immediate effect
const overrideRedHighlighting = () => {
  // Override any elements with red highlighting
  const redElements = document.querySelectorAll('[class*="htx-highlight"], [class*="highlight"], .htx-highlight, .highlight, .state');
  
  redElements.forEach(element => {
    if (element instanceof HTMLElement) {
      element.style.setProperty('background-color', '#ed1c24', 'important');
      element.style.setProperty('color', 'white', 'important');
      element.style.setProperty('opacity', '0.9', 'important');
      element.style.setProperty('border-radius', '3px', 'important');
      element.style.setProperty('padding', '2px 4px', 'important');
      element.style.setProperty('transition', 'all 0.2s ease', 'important');
      element.style.setProperty('box-shadow', '0 2px 6px rgba(237, 28, 36, 0.3)', 'important');
      element.style.setProperty('font-weight', '500', 'important');
      element.style.setProperty('border', 'none', 'important');
    }
  });
};

// Run immediately and also on DOM changes
overrideRedHighlighting();

// Fix tab styling issues on account settings page
const fixAccountSettingsTabs = () => {
  const tabElements = document.querySelectorAll('[class*="main-menu__item"]');
  
  tabElements.forEach(element => {
    if (element instanceof HTMLElement) {
      // Check if it's active
      const isActive = element.classList.contains('main-menu__item_active');
      
      if (isActive) {
        element.style.setProperty('background', 'rgb(25 44 89)', 'important');
        element.style.setProperty('color', 'white', 'important');
        element.style.setProperty('border', '1px solid rgb(25 44 89)', 'important');
      } else {
        element.style.setProperty('background', 'white', 'important');
        element.style.setProperty('color', 'rgb(25 44 89)', 'important');
        element.style.setProperty('border', '1px solid rgb(25 44 89)', 'important');
      }
    }
  });
};

// Run on page load and periodically to fix styling
fixAccountSettingsTabs();
setInterval(fixAccountSettingsTabs, 1000);

// Also run when DOM changes
const observer = new MutationObserver(() => {
  fixAccountSettingsTabs();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class']
});

// Aggressive text color fix for dark blue buttons
const fixButtonTextColor = () => {
  // Find all possible button elements
  const selectors = 'button, .button, span, .lsf-button, [class*="button"], [class*="Button"]';
  const buttons = document.querySelectorAll(selectors);
  
  buttons.forEach(element => {
    if (element instanceof HTMLElement) {
      const style = element.style;
      const computedStyle = window.getComputedStyle(element);
      
      // Check if element has dark blue background
      const hasDarkBlue = style.backgroundColor?.includes('rgb(25 44 89)') || 
          computedStyle.backgroundColor?.includes('rgb(25, 44, 89)') ||
          style.background?.includes('rgb(25 44 89)') ||
          element.classList.contains('white-text-button') ||
          element.classList.contains('lsf-button_look_primary');
      
      if (hasDarkBlue) {
        // Force white text with maximum specificity
        element.style.setProperty('color', '#ffffff', 'important');
        element.style.setProperty('--button-color', '#ffffff', 'important');
        element.style.setProperty('--color', '#ffffff', 'important');
        
        // Also force child elements
        const children = element.querySelectorAll('*');
        children.forEach(child => {
          if (child instanceof HTMLElement) {
            child.style.setProperty('color', '#ffffff', 'important');
          }
        });
      }
    }
  });
};

// Run immediately multiple times
fixButtonTextColor();
setTimeout(fixButtonTextColor, 50);
setTimeout(fixButtonTextColor, 100);
setTimeout(fixButtonTextColor, 200);

// Run on theme changes
const themeObserver = new MutationObserver(() => {
  fixButtonTextColor();
  setTimeout(fixButtonTextColor, 50);
  setTimeout(fixButtonTextColor, 100);
});

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-color-scheme']
});

// Run very frequently
setInterval(fixButtonTextColor, 200);

// Run on any DOM change
const domObserver = new MutationObserver(() => {
  fixButtonTextColor();
});

domObserver.observe(document.body, {
  childList: true,
  subtree: true
});
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', overrideRedHighlighting);
  window.addEventListener('load', overrideRedHighlighting);
  
  // Also run periodically to catch dynamically added elements
  setInterval(overrideRedHighlighting, 1000);
}

import "./app/App";
import "./utils/service-worker";
