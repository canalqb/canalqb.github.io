# 📊 SQL UPDATE SUMMARY - canalqbgit LOCALHOST

**Date:** 2026-03-10  
**Database:** canalqbgit (MySQL/MariaDB)  
**User:** root | **Password:** (empty)

---

## ✅ **FILES CREATED/UPDATED**

### 1. **NEW: mysql-canalqbgit.sql** ⭐ PRIMARY FILE
- **Location:** `sql/mysql-canalqbgit.sql`
- **Purpose:** Complete MySQL version for localhost XAMPP
- **Tables:** 4 tables with proper MySQL syntax
- **Status:** ✅ READY TO USE

### 2. **UPDATED: create-puzzles-encontrados.sql**
- **Location:** `sql/create-puzzles-encontrados.sql`
- **Changes:** Updated comments for dual compatibility (PostgreSQL + MySQL)
- **Status:** ✅ Documented

### 3. **NEW: MYSQL-CONFIG-GUIDE.md**
- **Location:** `MYSQL-CONFIG-GUIDE.md`
- **Purpose:** Complete setup and configuration guide
- **Includes:** Installation, migration, API integration, troubleshooting
- **Status:** ✅ READY

---

## 📋 **TABLES OVERVIEW**

| Table Name | Purpose | Key Fields | Indexes |
|------------|---------|------------|---------|
| **puzzles_encontrados** | Register discovered WIFs | preset, hex_private_key, wif, addresses | 6 indexes + unique |
| **puzzle_progress** | Horizontal mode progress | preset, inicio, fim | preset, updated_at |
| **puzzle_vertical_progress** | Vertical mode progress | preset, inicio, fim | preset, updated_at |
| **vertical_progress** | Per-user vertical progress | user_id, preset_bits, verification_count | 3 composite indexes|

---

## 🔧 **QUICK START GUIDE**

### Step 1: Open phpMyAdmin
```
URL: http://localhost/phpmyadmin
User: root
Password: (leave empty)
```

### Step 2: Create Database
```sql
CREATE DATABASE canalqbgit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Import Tables
1. Select database `canalqbgit` in phpMyAdmin
2. Click "SQL" tab
3. Copy entire content from `sql/mysql-canalqbgit.sql`
4. Click "Go"
5. Wait for "Query executed successfully" message

### Step 4: Verify
```sql
SHOW TABLES;
-- Should show 4 tables

DESCRIBE puzzles_encontrados;
-- Should show all columns with types
```

---

## 🎯 **KEY DIFFERENCES FROM SUPABASE (PostgreSQL)**

| Feature | PostgreSQL (Supabase) | MySQL (XAMPP) |
|---------|----------------------|---------------|
| **Auto-increment** | `GENERATED ALWAYS AS IDENTITY` | `AUTO_INCREMENT` |
| **Boolean** | `BOOLEAN` | `TINYINT(1)` |
| **JSON** | `JSONB` | `JSON` |
| **Timestamps** | `TIMESTAMP WITH TIME ZONE` | `TIMESTAMP` |
| **Comments** | `COMMENT ON COLUMN` | Inline `COMMENT 'text'` |
| **Triggers** | PL/pgSQL | BEGIN...END |
| **Updates** | Manual trigger needed | `ON UPDATE CURRENT_TIMESTAMP` |

---

## 💡 **USAGE EXAMPLES**

### Insert Puzzle Discovery:
```sql
INSERT INTO puzzles_encontrados (
    preset, hex_private_key, wif_compressed, 
    address_compressed, bits, mode
) VALUES (
    70, 
    'abc123def456...', 
    'L5ezRtGhKjP9...', 
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    70, 
    'horizontal'
);
```

### Update Progress (Horizontal):
```sql
INSERT INTO puzzle_progress (preset, inicio, fim)
VALUES (71, '4000000000000004a9', '7fffffffffffffff')
ON DUPLICATE KEY UPDATE 
    inicio = VALUES(inicio),
    updated_at = NOW();
```

### Check Statistics:
```sql
SELECT 
    preset,
    COUNT(*) as total_found,
    MAX(discovery_timestamp) as last_found
FROM puzzles_encontrados
GROUP BY preset
ORDER BY preset ASC;
```

---

## 🔄 **INTEGRATION WITH FRONTEND**

### Current Setup:
Your JavaScript files currently use Supabase SDK:
```javascript
// js/supabase-config.js
const { createClient } = supabase;
const supabaseClient= createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### To Use MySQL Localhost:

#### Option A: REST API via PHP (Recommended)
Create `api/puzzle-progress.php`:
```php
<?php
$pdo = new PDO('mysql:host=localhost;dbname=canalqbgit', 'root', '');

$preset = $_GET['preset'] ?? 0;
$stmt = $pdo->prepare("SELECT * FROM puzzle_progress WHERE preset = ?");
$stmt->execute([$preset]);
echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
?>
```

Update JavaScript:
```javascript
// Instead of Supabase call
const response = await fetch('http://localhost/canalqb.github.io/api/puzzle-progress.php?preset=71');
const data = await response.json();
```

#### Option B: Direct MySQL Connection (Not Recommended for Production)
Use WebSocket or Node.js middleware for direct DB access.

---

## 🛡️ **SECURITY NOTES**

### Current Configuration (Development):
- ✅ OK for localhost testing
- ✅ No password required
- ✅ Root access

### For Production:
- ❌ Set root password
- ❌ Create dedicated user with limited privileges
- ❌ Use prepared statements (already included)
- ❌ Enable query logging
- ❌ Restrict CORS origins

---

## 📊 **DATA MIGRATION**

### From Supabase to MySQL:

#### Export from Supabase:
```sql
-- In Supabase SQL Editor
COPY (SELECT * FROM puzzle_progress) 
TO STDOUT WITH CSV HEADER;
```

#### Import to MySQL:
```sql
LOAD DATA INFILE 'C:/path/to/puzzle_progress.csv'
INTO TABLE puzzle_progress
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
```

---

## ✅ **VERIFICATION CHECKLIST**

After running the SQL script, verify:

- [ ] Database `canalqbgit` exists
- [ ] 4 tables created: puzzles_encontrados, puzzle_progress, puzzle_vertical_progress, vertical_progress
- [ ] All triggers working (updated_at auto-updates)
- [ ] Indexes created (check with `SHOW INDEX FROM table_name`)
- [ ] Character set is utf8mb4
- [ ] Can INSERT test data
- [ ] Can SELECT data
- [ ] Can UPDATE without errors
- [ ] UNIQUE constraints working

Run this verification query:
```sql
USE canalqbgit;

-- Check tables exist
SHOW TABLES;

-- Check structure
DESCRIBE puzzles_encontrados;
DESCRIBE puzzle_progress;

-- Check triggers
SHOW TRIGGERS;

-- Check indexes
SHOW INDEX FROM puzzles_encontrados;

-- Test insert
INSERT INTO puzzle_progress (preset, inicio, fim) 
VALUES (999, 'test123', 'test456');

-- Test update (updated_at should change automatically)
UPDATE puzzle_progress SET inicio='newvalue' WHERE preset=999;

-- Verify timestamp updated
SELECT preset, inicio, updated_at FROM puzzle_progress WHERE preset=999;

-- Clean up test data
DELETE FROM puzzle_progress WHERE preset=999;
```

---

## 🐛 **COMMON ISSUES & SOLUTIONS**

### Issue 1: "Table already exists"
**Solution:** Drop tables first or use `CREATE TABLE IF NOT EXISTS`
```sql
DROP TABLE IF EXISTS puzzles_encontrados;
DROP TABLE IF EXISTS puzzle_progress;
-- Then run the script again
```

### Issue 2: "Access denied for user 'root'"
**Solution:** Reset MySQL permissions
```bash
# Stop MySQL
net stop mysql

# Start with skip-grant-tables
mysqld --skip-grant-tables

# In another terminal:
mysql-u root
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
```

### Issue 3: "Incorrect datetime value"
**Solution:** Ensure TIMESTAMP format
```sql
SET sql_mode = '';
SET GLOBAL sql_mode = '';
```

---

## 📈 **PERFORMANCE TIPS**

1. **Add indexes for frequent queries:**
```sql
CREATE INDEX idx_preset_mode ON puzzles_encontrados(preset, mode);
CREATE INDEX idx_user_active ON vertical_progress(user_id, preset_bits);
```

2. **Optimize table regularly:**
```sql
OPTIMIZE TABLE puzzles_encontrados;
OPTIMIZE TABLE puzzle_progress;
```

3. **Monitor slow queries:**
Edit`c:\xampp\mysql\bin\my.ini`:
```ini
[mysqld]
slow_query_log=1
long_query_time=2
```

---

## 🎉 **SUCCESS CONFIRMATION**

When you see this output, everything worked:
```
✅ Query OK, 0 rows affected (0.001 sec)
✅ 4 tables created
✅ 4 triggers created
✅ 15 indexes created
✅ Database ready for use!
```

---

## 📞 **NEXT STEPS**

1. ✅ Run `sql/mysql-canalqbgit.sql` in phpMyAdmin
2. ✅ Verify all tables created successfully
3. ✅ Test with sample data
4. ✅ Update JavaScript to connect to MySQL API
5. ✅ Monitor performance and optimize

---

**ALL SQL FILES UPDATED AND READY FOR YOUR canalqbgit DATABASE!** 🚀

For detailed setup instructions, see: [`MYSQL-CONFIG-GUIDE.md`](MYSQL-CONFIG-GUIDE.md)
