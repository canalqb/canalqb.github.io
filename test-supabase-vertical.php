<?php
$data = json_encode([
    'user_id' => 'test_123', 
    'preset_bits' => 10, 
    'preset_inicio' => '1', 
    'preset_fim' => '2', 
    'last_hex_value' => '3', 
    'last_verification_count' => 1
]); 

$ch = curl_init('https://ojcqpgnxfnmwvzscwqjl.supabase.co/rest/v1/vertical_progress'); 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 
curl_setopt($ch, CURLOPT_POST, true); 
curl_setopt($ch, CURLOPT_POSTFIELDS, $data); 
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For test on localhost XAMPP
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qY3FwZ254Zm5td3Z6c2N3cWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MzU2MTcsImV4cCI6MjA0NjMxMTYxN30.3E2xY2xNzZ8L9JkQ1mH2wP7rT4sX6vY9zA1bC2dE3f', 
    'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qY3FwZ254Zm5td3Z6c2N3cWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MzU2MTcsImV4cCI6MjA0NjMxMTYxN30.3E2xY2xNzZ8L9JkQ1mH2wP7rT4sX6vY9zA1bC2dE3f', 
    'Content-Type: application/json', 
    'Prefer: return=representation'
]); 
$res = curl_exec($ch);
if($res === false) {
    echo "Curl error: " . curl_error($ch) . "\n";
} else {
    echo "Response: " . $res . "\n";
    $info = curl_getinfo($ch);
    echo "Status code: " . $info['http_code'] . "\n";
}
curl_close($ch);
