import sqlite3

conn = sqlite3.connect('cleanease.db')

migrations = [
    ('Order Placed', 'Pending'),
    ('Being Washed', 'Processing'),
    ('Delivered',    'Completed'),
]

for new_status, old_status in migrations:
    conn.execute('UPDATE orders SET status = ? WHERE status = ?', (new_status, old_status))
    rows = conn.execute('SELECT changes()').fetchone()[0]
    print(f'Migrated "{old_status}" -> "{new_status}": {rows} rows')

conn.commit()
conn.close()
print('Migration complete.')
