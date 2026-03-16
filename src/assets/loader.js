(function () {

  const loaderElement = document.getElementById('global-loader') || document.createElement('div');
  loaderElement.id = 'global-loader';
  loaderElement.style.display = 'none';
  loaderElement.style.position = 'fixed';
  loaderElement.style.top = '0';
  loaderElement.style.left = '0';
  loaderElement.style.width = '100%';
  loaderElement.style.height = '100%';
  loaderElement.style.background = 'rgba(0, 0, 0, 0.8)';
  loaderElement.style.zIndex = '9999';
  loaderElement.style.justifyContent = 'center';
  loaderElement.style.alignItems = 'center';
  loaderElement.style.color = 'white';
  loaderElement.style.fontSize = '20px';
  // loaderElement.style.display = 'flex';
  loaderElement.style.flexDirection = 'column';

  if (!loaderElement.parentNode) {
    document.body.appendChild(loaderElement);
  }

  const spinner = document.createElement('div');
  spinner.style.border = '4px solid rgba(255, 255, 255, 0.84)';
  spinner.style.borderTop = '4px solid rgb(7, 119, 170)';
  spinner.style.borderRadius = '50%';
  spinner.style.width = '40px';
  spinner.style.height = '40px';
  spinner.style.animation = 'spin 1s linear infinite';

  const messageElement = document.getElementById('loader-message') || document.createElement('div');
  messageElement.id = 'loader-message';
  messageElement.style.marginTop = '10px';

  loaderElement.innerHTML = '';
  loaderElement.appendChild(spinner);
  loaderElement.appendChild(messageElement);

  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

   window.showLoader = function (show, message = 'Loading...') {
    if (!loaderElement || !messageElement) {
      console.error('Loader elements not found');
      return;
    }

    if (show) {
      messageElement.textContent = message;
      loaderElement.style.display = 'flex';
    } else {
      loaderElement.style.display = 'none';
    }
  };
})();
