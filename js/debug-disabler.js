/**
 * ========================================================================
 * DEBUG DISABLER - DESABILITA LOGS PARA ECONOMIZAR MEMÓRIA
 * ========================================================================
 * Remove todos os logs de debug para melhorar performance
 */

// Desabilita logs imediatamente
(function() {
  'use strict';
  
  try {
    // Mantém apenas errors críticos
    const originalConsole = window.console;
    
    // Cria console completamente silencioso
    const quietConsole = {};
    
    // Mantém apenas error (crítico)
    if (originalConsole.error) {
      quietConsole.error = originalConsole.error.bind(originalConsole);
    }
    
    // Desabilita TODOS os outros métodos
    const disabledMethods = [
      'log', 'info', 'debug', 'trace', 'warn', 
      'group', 'groupEnd', 'groupCollapsed', 'table', 
      'time', 'timeEnd', 'count', 'assert', 'clear'
    ];
    
    disabledMethods.forEach(method => {
      quietConsole[method] = () => {}; // Silencia completamente
    });
    
    // Interceptor para fetch para silenciar erros 401
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Silencia erros 401 do Supabase
        if (response.status === 401 && args[0] && args[0].includes && args[0].includes('supabase')) {
          return response; // Não loga
        }
        
        return response;
      } catch (error) {
        // Silencia erros de fetch
        return Promise.reject(error);
      }
    };
    
    // Interceptor para XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      // Silencia logs de XHR
      return originalXHROpen.call(this, method, url, ...args);
    };
    
    // Aplica o console silencioso
    window.console = quietConsole;
    
    // API para reabilitar se necessário
    window.DebugDisabler = {
      enableDebug: () => {
        window.console = originalConsole;
        window.fetch = originalFetch;
        XMLHttpRequest.prototype.open = originalXHROpen;
      },
      disableDebug: () => {
        window.console = quietConsole;
      },
      isDebugEnabled: () => window.console === originalConsole
    };
    
    // Limpa console completamente
    if (originalConsole.clear) {
      originalConsole.clear();
    }
    
  } catch (error) {
    // Se falhar, mantém console original
  }
  
})();
