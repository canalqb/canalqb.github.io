/**
 * ========================================================================
 * SIMPLE SUPABASE TEST - TESTE SIMPLES DA CHAVE
 * ========================================================================
 * Testa rápido se a chave do Supabase está funcionando
 */

// Teste simples da chave Supabase
async function testSupabaseKey() {
  const url = 'https://dhpzusdynwpnsejnlzvf.supabase.co';
  const key = 'sb_publishable_CzrMyXDeFQmd1cTZ4Uls3A_l83xJJsa';
  
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Chave Supabase funcionando!');
      return true;
    } else {
      console.error('❌ Chave Supabase falhou:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar chave:', error);
    return false;
  }
}

// Testa automaticamente após 2 segundos
setTimeout(() => {
  console.log('🔍 Testando chave Supabase...');
  testSupabaseKey();
}, 2000);

// API global
window.testSupabaseKey = testSupabaseKey;
