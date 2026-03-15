# 🗄️ MYSQL LOCALHOST CONFIGURATION GUIDE

**Database:** `canalqbgit`  
**User:** `root`  
**Password:** `(empty)`  
**Host:** `localhost`  
**Port:** `3306` (default XAMPP)

---

## 📋 **TABLES CREATED**

### 1. **puzzles_encontrados**
- Purpose: Register discovered Bitcoin puzzle WIFs
- Fields: id, preset, hex_private_key, wif_compressed, wif_uncompressed, addresses, bits, mode, timestamps
- Indexes: preset, hex_key, wif, timestamp, mode

### 2. **puzzle_progress**
- Purpose: Store horizontal mode progress
- Fields: id, preset, inicio, fim, timestamps
- Unique: preset

### 3. **puzzle_vertical_progress**
- Purpose: Store vertical mode progress
- Fields: id, preset, inicio, fim, timestamps
- Unique: preset

### 4. **vertical_progress**
- Purpose: Store vertical progress per user
- Fields: id, user_id, preset_bits, preset_inicio, preset_fim, last_hex_value, verification_count, timestamps

---

## 🔧 **INSTALLATION STEPS**

### Step 1: Start XAMPP
```bash
# Open XAMPP Control Panel
# Start Apache and MySQL
# Access phpMyAdmin: http://localhost/phpmyadmin
```

### Step 2: Create Database
```sql
CREATE DATABASE canalqbgit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Run SQL Script
**Option A: Via phpMyAdmin**
1. Open http://localhost/phpmyadmin
2. Select database `canalqbgit`
3. Click "SQL" tab
4. Copy content from `sql/mysql-canalqbgit.sql`
5. Click "Go"

**Option B: Via Command Line**
```bash
cd c:\xampp\htdocs\canalqb.github.io\sql
mysql-u root -p canalqbgit < mysql-canalqbgit.sql
```

### Step 4: Verify Tables
```sql
USE canalqbgit;
SHOW TABLES;
DESCRIBE puzzles_encontrados;
DESCRIBE puzzle_progress;
```

---

## 🔄 **MIGRATION FROM SUPABASE**

If you have data in Supabase (PostgreSQL) and want to migrate to localhost MySQL:

### Export from Supabase:
```sql
-- In Supabase SQL Editor
COPY puzzles_encontrados TO STDOUT WITH CSV HEADER;
COPY puzzle_progress TO STDOUT WITH CSV HEADER;
```

### Import to MySQL:
```sql
-- In MySQL/phpMyAdmin
LOAD DATA INFILE 'puzzles_encontrados.csv'
INTO TABLE puzzles_encontrados
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
```

---

## 💻 **JAVASCRIPT CONFIGURATION**

To use MySQL instead of Supabase, update your JavaScript config:

### File: `js/supabase-config.js`
```javascript
// Change from Supabase to MySQL API endpoint
const CONFIG = {
  // OLD (Supabase)
  // SUPABASE_URL: 'https://xxxxx.supabase.co',
  // SUPABASE_ANON_KEY: 'xxxxx',
  
  // NEW (MySQL via PHP API)
  API_URL: 'http://localhost/canalqb-api/',
  DATABASE: 'canalqbgit',
  USER: 'root',
  PASSWORD: ''
};
```

### Create PHP API Endpoint:
**File:** `api/puzzle-progress.php`
```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = new PDO('mysql:host=localhost;dbname=canalqbgit;charset=utf8mb4', 'root', '');

$action = $_GET['action'] ?? '';

if ($action === 'get_progress') {
    $preset = $_GET['preset'] ?? 0;
    $stmt = $pdo->prepare("SELECT * FROM puzzle_progress WHERE preset= ?");
    $stmt->execute([$preset]);
    echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
}

if ($action === 'update_progress') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $sql = "INSERT INTO puzzle_progress (preset, inicio, fim) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            inicio = VALUES(inicio),
            updated_at = NOW()";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['preset'],
        $data['inicio'],
        $data['fim']
    ]);
    
    echo json_encode(['success' => true]);
}
?>
```

---

## 📊 **TESTING QUERIES**

### Check Progress:
```sql
SELECT preset, inicio, fim, updated_at 
FROM puzzle_progress 
ORDER BY preset;
```

### Check Found Puzzles:
```sql
SELECT preset, COUNT(*) as total_found, 
       MAX(discovery_timestamp) as last_found
FROM puzzles_encontrados
GROUP BY preset
ORDER BY preset;
```

### Check Vertical Progress:
```sql
SELECT user_id, preset_bits, last_hex_value, 
       last_verification_count, updated_at
FROM vertical_progress
ORDER BY updated_at DESC;
```

---

## 🔐 **SECURITY RECOMMENDATIONS**

### For Production:
1. **Set root password:**
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_secure_password';
FLUSH PRIVILEGES;
```

2. **Create dedicated user:**
```sql
CREATE USER 'canalqb_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON canalqbgit.* TO 'canalqb_user'@'localhost';
FLUSH PRIVILEGES;
```

3. **Enable only necessary privileges:**
```sql
-- Instead of ALL PRIVILEGES, grant only what's needed:
GRANT SELECT, INSERT, UPDATE ON canalqbgit.puzzle_progress TO 'canalqb_user'@'localhost';
GRANT SELECT, INSERT ON canalqbgit.puzzles_encontrados TO 'canalqb_user'@'localhost';
```

---

## 🐛 **TROUBLESHOOTING**

### Issue: Cannot connect to MySQL
**Solution:**
```bash
# Check if MySQL is running
netstat -an | findstr "3306"

# Restart MySQL in XAMPP
# Stop -> Wait 5 seconds -> Start
```

### Issue: Table doesn't exist
**Solution:**
```sql
-- Check if table was created
SHOW TABLES LIKE '%puzzle%';

-- If missing, run the CREATE TABLE statement again
SOURCE c:/xampp/htdocs/canalqb.github.io/sql/mysql-canalqbgit.sql;
```

### Issue: Character encoding problems
**Solution:**
```sql
-- Set proper encoding
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Verify
SHOW VARIABLES LIKE 'character_set%';
```

---

## 📈 **PERFORMANCE OPTIMIZATION**

### Add Indexes for Common Queries:
```sql
-- Speed up preset lookups
CREATE INDEX idx_preset_bits ON vertical_progress(preset_bits);

-- Speed up date range queries
CREATE INDEX idx_discovery_date ON puzzles_encontrados(discovery_timestamp);

-- Composite index for common filter
CREATE INDEX idx_user_preset_date ON vertical_progress(user_id, preset_bits, updated_at);
```

### Optimize Table:
```sql
ANALYZE TABLE puzzles_encontrados;
OPTIMIZE TABLE puzzle_progress;
```

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] Database `canalqbgit` created
- [ ] All 4 tables created successfully
- [ ] Triggers are working(updated_at auto-update)
- [ ] Can insert test data
- [ ] Can query data
- [ ] Indexes are created
- [ ] Character set is utf8mb4
- [ ] Connection from JavaScript/PHP works

---

## 🚀 **NEXT STEPS**

1. **Test basic operations:**
   - Insert sample data
   - Update progress
   - Query results

2. **Integrate with frontend:**
   - Update JavaScript config
   - Create PHP API endpoints
   - Test AJAX calls

3. **Monitor performance:**
   - Enable slow query log
   - Check table sizes
   - Optimize indexes

---

**DATABASE READY FOR USE!** 🎉

For questions or issues, check the logs:
- MySQL error log: `c:\xampp\mysql\data\mysql_error.log`
- Apache access log: `c:\xampp\apache\logs\access.log`
