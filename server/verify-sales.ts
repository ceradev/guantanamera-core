
const API_URL = 'http://localhost:8000';
const API_KEY = process.env.ADMIN_API_KEY || 'your-admin-api-key';

async function main() {
  console.log('--- Starting Verification (API Only) ---');

  try {
    // 1. Get a product via API
    console.log('Fetching products via API...');
    let productId;
    
    // GET /products returns Categories -> products[]
    const productsRes = await fetch(`${API_URL}/products`, {
        headers: { 'x-api-key': API_KEY }
    });

    if (productsRes.ok) {
        const categories = await productsRes.json();
        
        // Iterate through categories to find a product
        if (Array.isArray(categories)) {
            for (const cat of categories) {
                if (cat.products && cat.products.length > 0) {
                    const product = cat.products[0];
                    productId = product.id;
                    console.log(`Found product via API: ${product.name} (ID: ${productId}) in Category: ${cat.name}`);
                    break;
                }
            }
        }
    } else {
        console.warn(`Could not list products (${productsRes.status}).`);
    }

    if (!productId) {
         console.warn('⚠️ No products found in any category. Verification might fail if DB is empty.');
         // We could try to create a product here if we wanted to be super robust, 
         // but that requires a Category ID first. 
         // For now, let's assume seed data exists or use a likely ID.
         productId = 1; 
         console.log('Using Fallback Product ID: 1');
    }

    // 2. Create Manual Sale via API
    const saleData = {
        date: new Date().toISOString(),
        items: [
        { productId: productId, quantity: 2 }
        ],
        notes: 'Verification Manual Sale API Only'
    };

    console.log(`Creating Manual Sale for Product ID ${productId}...`);
    const res = await fetch(`${API_URL}/sales/manual`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
        },
        body: JSON.stringify(saleData)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to create sale: ${res.status} ${res.statusText} - ${err}`);
    }

    const sale = await res.json();
    console.log('✅ Sale Created:', sale.id);

    // 3. Verify in Stats
    console.log('Fetching Stats...');
    const statsRes = await fetch(`${API_URL}/sales/stats?type=day`, {
        headers: { 'x-api-key': API_KEY }
    });
    
    if (!statsRes.ok) {
         const err = await statsRes.text();
         throw new Error(`Failed to fetch stats: ${statsRes.status} ${statsRes.statusText} - ${err}`);
    }

    const stats = await statsRes.json();
    console.log('Stats Summary:', {
        totalSales: stats.totalSales,
        totalOrders: stats.totalOrders
    });

    if (stats.totalSales > 0) {
        console.log('✅ Verification SUCCESS: Sales data reflected in stats.');
        console.log('Check the Dashboard to see the changes visually.');
    } else {
        console.error('❌ Verification FAILED: Stats do not reflect data.');
    }

  } catch (error) {
    console.error('❌ Verification Error:', error);
  }
}

main();
