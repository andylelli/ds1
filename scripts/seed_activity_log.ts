import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'dropship_sim'
});

async function seedActivityLog() {
  console.log('Seeding activity log with test data...');
  
  const testActivities = [
    {
      agent: 'System',
      action: 'simulation_started',
      category: 'system',
      status: 'completed',
      message: 'Starting simulation for category: Fitness',
      details: JSON.stringify({ category: 'Fitness' })
    },
    {
      agent: 'Research',
      action: 'find_products',
      category: 'research',
      status: 'completed',
      entityType: 'product',
      entityId: 'prod-123',
      message: 'Found product: Smart Fitness Tracker',
      details: JSON.stringify({ 
        product: 'Smart Fitness Tracker',
        demandScore: 85,
        competitionScore: 45
      })
    },
    {
      agent: 'CEO',
      action: 'evaluate_product',
      category: 'ceo',
      status: 'completed',
      entityType: 'product',
      entityId: 'prod-123',
      message: 'Approved product: Smart Fitness Tracker',
      details: JSON.stringify({ 
        approved: true,
        reason: 'High demand, low competition, good margins'
      })
    },
    {
      agent: 'Supplier',
      action: 'find_suppliers',
      category: 'sourcing',
      status: 'completed',
      entityType: 'product',
      entityId: 'prod-123',
      message: 'Suppliers found for Smart Fitness Tracker'
    },
    {
      agent: 'Store',
      action: 'create_page',
      category: 'store',
      status: 'completed',
      entityType: 'product',
      entityId: 'prod-123',
      message: 'Product page created: /products/smart-fitness-tracker',
      details: JSON.stringify({ url: '/products/smart-fitness-tracker' })
    },
    {
      agent: 'Marketing',
      action: 'create_campaign',
      category: 'marketing',
      status: 'completed',
      entityType: 'campaign',
      entityId: 'camp-456',
      message: 'Campaign created: camp-456',
      details: JSON.stringify({ 
        campaignId: 'camp-456',
        platform: 'Facebook',
        budget: 100
      })
    }
  ];

  try {
    for (const activity of testActivities) {
      await pool.query(
        `INSERT INTO activity_log (agent, action, category, status, entity_type, entity_id, message, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          activity.agent,
          activity.action,
          activity.category,
          activity.status,
          activity.entityType || null,
          activity.entityId || null,
          activity.message,
          activity.details || null
        ]
      );
    }
    
    console.log(`✅ Seeded ${testActivities.length} test activities`);
    
    // Verify
    const result = await pool.query('SELECT COUNT(*) FROM activity_log');
    console.log(`Total activities in database: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Failed to seed activities:', error);
  } finally {
    await pool.end();
  }
}

seedActivityLog();
