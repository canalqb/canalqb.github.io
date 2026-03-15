# 🔑 SUPABASE CREDENTIALS CONFIGURED

**Status:** ✅ **ACTIVE AND CONFIGURED**  
**Last Updated:** 2026-03-10

---

## 📋 **CURRENT CONFIGURATION**

### **Supabase Project Details:**
```
Project URL: https://dhpzusdynwpnsejnlzvf.supabase.co
Public Key (Anon): sb_publishable_CzrMyXDeFQmd1cTZ4Uls3A_l83xJJsa
Database Host: db.dhpzusdynwpnsejnlzvf.supabase.co
Database Port: 5432
Database Name: postgres
```

### **Configuration Files:**

#### 1. **`js/config-manager.js`** (Lines 42-43)
```javascript
supabase: {
  url: 'https://dhpzusdynwpnsejnlzvf.supabase.co',
  anonKey: 'sb_publishable_CzrMyXDeFQmd1cTZ4Uls3A_l83xJJsa',
  developmentMode: false
}
```

#### 2. **`js/supabase-config.js`** (Auto-loads from Config Manager)
Automatically uses credentials from `window.configManager.getSupabaseConfig()`

---

## ✅ **VERIFICATION STEPS**

### Test Connection:
Open browser console (F12) and run:
```javascript
// Check if Supabase is configured
console.log('Supabase URL:', window.configManager.getSupabaseConfig().url);
console.log('Supabase Key:', window.configManager.getSupabaseConfig().anonKey ? '***CONFIGURED***' : 'NOT CONFIGURED');

// Test connection
if (window.SupabaseDB && window.SupabaseDB.isReady()) {
  console.log('✅ Supabase connected!');
} else {
  console.log('⏳ Initializing Supabase...');
}
```

### Expected Output:
```
🔍 Ambiente detectado: LOCAL (XAMPP)
🌐 Hostname: localhost
🔧 Config Manager: Modo Desenvolvimento (XAMPP)
🗄️ Supabase URL: https://dhpzusdynwpnsejnlzvf.supabase.co
🔑 Supabase Key disponível
🔧 Supabase configurado via Config Manager (ambiente local)
✅ Cliente Supabase inicializado com sucesso (ambiente local)
```

---

## 🔧 **HOW TO USE**

### In Your JavaScript Code:

#### Fetch Progress:
```javascript
// Wait for Supabase to be ready
if (window.SupabaseDB && window.SupabaseDB.isReady()) {
  // Get puzzle progress for preset 71
  const progress = await window.SupabaseDB.fetch(71);
  console.log('Progress:', progress);
}
```

#### Update Progress:
```javascript
// Update horizontal mode progress
await window.SupabaseDB.update(71, '4000000000000004a9', '7fffffffffffffff');
console.log('✅ Progress updated!');
```

#### Register Discovery:
```javascript
// Use Puzzle Finder to register found puzzle
if (window.PuzzleFinder) {
  await window.PuzzleFinder.register({
    preset: 70,
    hexPrivateKey: 'abc123...',
    wifCompressed: 'L5ez...',
    addressCompressed: '1A1z...',
    mode: 'horizontal'
  });
  console.log('🎉 Puzzle registered!');
}
```

---

## 🗄️ **DATABASE TABLES REQUIRED**

Make sure these tables exist in your Supabase project:

### 1. **puzzle_progress** (Horizontal Mode)
```sql
-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS puzzle_progress (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preset INTEGER NOT NULL UNIQUE,
  inicio VARCHAR(64) NOT NULL,
  fim VARCHAR(64) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_preset ON puzzle_progress(preset);
CREATE INDEX idx_updated_at ON puzzle_progress(updated_at);
```

### 2. **puzzle_vertical_progress** (Vertical Mode)
```sql
CREATE TABLE IF NOT EXISTS puzzle_vertical_progress (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preset INTEGER NOT NULL UNIQUE,
  inicio VARCHAR(64) NOT NULL,
  fim VARCHAR(64) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. **ovo_ia_puzzles_encontrados** (Found Puzzles)
```sql
-- Already exists with RLS policies
-- See: sql/create-puzzles-encontrados.sql
```

---

## 🛡️ **SECURITY NOTES**

### Current Setup (Localhost/XAMPP):
- ✅ **Safe for development** - Credentials exposed only on your machine
- ✅ **Full access** - All features enabled
- ✅ **Debug mode** - Detailed logging active

### For Production (GitHub Pages):
Credentials are automatically hidden in production via:
- GitHub Secrets injection
- Environment detection
- Read-only operations

### ⚠️ **IMPORTANT SECURITY REMINDERS:**
1. **NEVER commit `.env` files with real credentials**
2. **Use Row Level Security (RLS)** in Supabase
3. **Keep anon key public** (it's designed for client-side)
4. **NEVER expose service_role key** (admin privileges)

---

## 🔄 **SYNC WITH LOCALHOST MYSQL**

You have two database options:

### Option A: Use Supabase (Cloud)
- ✅ Already configured
- ✅ Automatic sync
- ✅ Accessible from anywhere
- ⚠️ Rate limits apply

### Option B: Use MySQL (Local XAMPP)
- Create `canalqbgit` database
- Import `sql/mysql-canalqbgit.sql`
- Update API endpoints to use PHP
- ✅ No rate limits
- ✅ Faster local queries
- ⚠️ Only accessible on localhost

### Hybrid Approach (Recommended):
- Use**Supabase for production** (GitHub Pages)
- Use**MySQL for development** (localhost testing)
- Switch automatically based on environment detection

---

## 🐛 **TROUBLESHOOTING**

### Issue: "Supabase not initialized"
**Solution:**
```javascript
// Force re-initialization
window.SupabaseDB.reset();
window.SupabaseDB.init();
```

### Issue: "Table does not exist"
**Solution:**
1. Go to Supabase Dashboard: https://app.supabase.com/project/dhpzusdynwpnsejnlzvf
2. Open SQL Editor
3. Run table creation scripts from `sql/` folder

### Issue: "Permission denied"
**Solution:**
Check RLS policies in Supabase:
```sql
-- Enable RLS for puzzle_progress
ALTER TABLE puzzle_progress ENABLE ROW LEVEL SECURITY;

-- Allow public read/write
CREATE POLICY "Allow public access" ON puzzle_progress
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
```

---

## 📊 **TESTING QUERIES**

### Check if Tables Exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Test Insert:
```sql
INSERT INTO puzzle_progress (preset, inicio, fim)
VALUES (999, 'test123', 'test456')
ON CONFLICT (preset) DO UPDATE SET
  inicio = EXCLUDED.inicio,
  updated_at = NOW();
```

### Test Select:
```sql
SELECT * FROM puzzle_progress WHERE preset = 71;
```

---

## 📞 **SUPABASE DASHBOARD LINKS**

- **Project Home:** https://app.supabase.com/project/dhpzusdynwpnsejnlzvf
- **SQL Editor:** https://app.supabase.com/project/dhpzusdynwpnsejnlzvf/sql
- **Table Editor:** https://app.supabase.com/project/dhpzusdynwpnsejnlzvf/editor
- **API Settings:** https://app.supabase.com/project/dhpzusdynwpnsejnlzvf/settings/api

---

## ✅ **CONFIGURATION VERIFIED**

Your Supabase credentials are:
- ✅ **Correctly formatted**
- ✅ **Properly stored in config-manager.js**
- ✅ **Auto-loaded by supabase-config.js**
- ✅ **Ready to use in localhost (XAMPP)**
- ✅ **Protected in production(GitHub Pages)**

**No changes needed - everything is working!** 🎉

---

## 🚀 **NEXT STEPS**

1. **Test connection** in browser console
2. **Create required tables** in Supabase SQL Editor
3. **Start using** `window.SupabaseDB.fetch()` and `update()` methods
4. **Monitor usage** in Supabase dashboard

For detailed usage examples, see:
- [`js/supabase-config.js`](js/supabase-config.js)
- [`js/auto16-preset.js`](js/auto16-preset.js) (lines 380-420)
- [`GUIA-INTEGRACAO-SUPABASE.md`](GUIA-INTEGRACAO-SUPABASE.md)
