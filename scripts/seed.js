const dotenv = require('dotenv');
const { connectToDatabase, closeDatabase } = require('../config/database');
const Place = require('../models/Place');
const Promo = require('../models/Promo');

dotenv.config();

// Sample places data
const samplePlaces = [
    {
        placeId: 'savsav',
        name: 'Savsav',
        address: '780 Avenue Brewster',
        district: 'Saint-Henri',
        vibe: 'Industrial, warm, very bright',
        studyAtmosphere: ['Calm weekdays', 'Great for group work'],
        wifi: true,
        outlets: true,
        food: ['Brunch', 'Pastries'],
        hours: '8–16 weekdays, 9–16 weekend',
        tags: ['Aesthetic', 'Cowork-friendly'],
        coords: { lat: 45.47957, lng: -73.58614 },
        priceLevel: '$$'
    },
    {
        placeId: 'constance',
        name: 'Café Constance',
        address: '123 Rue Example',
        district: 'Plateau Mont-Royal',
        vibe: 'Cozy, minimalist, natural light',
        studyAtmosphere: ['Quiet mornings', 'Perfect for deep focus'],
        wifi: true,
        outlets: true,
        food: ['Coffee', 'Pastries', 'Light lunch'],
        hours: '7–18 daily',
        tags: ['Quiet', 'Minimalist'],
        coords: { lat: 45.5175, lng: -73.5724 },
        priceLevel: '$$'
    },
    {
        placeId: 'crew',
        name: 'Crew Collective',
        address: '360 Rue Saint-Jacques',
        district: 'Old Montreal',
        vibe: 'Grand, architectural, inspiring',
        studyAtmosphere: ['Social atmosphere', 'Great for meetings'],
        wifi: true,
        outlets: true,
        food: ['Coffee', 'Light snacks'],
        hours: '7–19 weekdays, 9–17 weekend',
        tags: ['Coworking', 'Impressive'],
        coords: { lat: 45.5017, lng: -73.5673 },
        priceLevel: '$$$'
    }
];

// Sample promos data
const samplePromos = [
    {
        promoId: 'pr_001',
        placeId: 'constance',
        title: '☕ -15% student latte',
        description: 'After 4PM with student card',
        tag: 'Students',
        promoStart: new Date('2026-01-01'),
        promoEnd: new Date('2026-12-31'),
        isActive: true
    },
    {
        promoId: 'pr_002',
        placeId: 'savsav',
        title: '🥐 Free pastry with coffee',
        description: 'Monday to Wednesday only',
        tag: 'Food',
        promoStart: new Date('2026-01-01'),
        promoEnd: new Date('2026-06-30'),
        isActive: true
    },
    {
        promoId: 'pr_003',
        placeId: 'crew',
        title: '📚 Study group discount',
        description: '10% off for groups of 3+',
        tag: 'Groups',
        promoStart: new Date('2026-01-15'),
        promoEnd: new Date('2026-12-31'),
        isActive: true
    }
];

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');
        
        // Connect to database
        const db = await connectToDatabase();
        
        console.log('📍 Seeding places...');
        
        // Clear existing places
        await db.collection('places').deleteMany({});
        
        // Insert sample places
        for (const placeData of samplePlaces) {
            try {
                await Place.createPlace(placeData);
                console.log(`  ✅ Created place: ${placeData.name}`);
            } catch (error) {
                console.error(`  ❌ Failed to create place ${placeData.name}:`, error.message);
            }
        }
        
        console.log('🎟️  Seeding promos...');
        
        // Clear existing promos
        await db.collection('promos').deleteMany({});
        
        // Insert sample promos
        for (const promoData of samplePromos) {
            try {
                await Promo.createPromo(promoData);
                console.log(`  ✅ Created promo: ${promoData.title}`);
            } catch (error) {
                console.error(`  ❌ Failed to create promo ${promoData.title}:`, error.message);
            }
        }
        
        console.log('\n✨ Database seeding completed successfully!');
        console.log(`   - ${samplePlaces.length} places`);
        console.log(`   - ${samplePromos.length} promos`);
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await closeDatabase();
        process.exit(0);
    }
}

// Run seeding if called directly
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase, samplePlaces, samplePromos };
