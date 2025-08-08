import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { barbers } from '@/database/schema';
import fs from 'fs';
import path from 'path';

// POST: Seed barbers from barbers.json into database
export async function POST(req: NextRequest) {
  try {
    console.log('Seeding barbers from JSON file...');
    
    // Read barber data from barbers.json
    const barbersFilePath = path.join(process.cwd(), 'public', 'barbers.json');
    const barbersData = JSON.parse(fs.readFileSync(barbersFilePath, 'utf8'));
    
    console.log(`Found ${barbersData.length} barbers to import`);
    
    // Transform JSON data to database format
    const barbersToInsert = barbersData.map((barber: any) => ({
      id: barber.id, // Keep original ID for consistency
      name: barber.name,
      specialties: JSON.stringify(barber.specialties), // Convert array to JSON string
      experience: barber.experience,
      rating: barber.rating.toString(), // Convert to string for decimal field
      image: barber.image,
      branches: JSON.stringify(barber.branches), // Convert array to JSON string
    }));
    
    // Insert barbers into database
    const insertedBarbers = await db.insert(barbers).values(barbersToInsert).returning();
    
    console.log(`Successfully inserted ${insertedBarbers.length} barbers`);
    
    return NextResponse.json({
      message: 'Barbers seeded successfully',
      count: insertedBarbers.length,
      barbers: insertedBarbers.map(barber => ({
        id: barber.id,
        name: barber.name,
        specialties: JSON.parse(barber.specialties),
        experience: barber.experience,
        rating: parseFloat(barber.rating),
        branches: JSON.parse(barber.branches)
      })),
      success: true
    });
    
  } catch (error: any) {
    console.error('Error seeding barbers:', error);
    return NextResponse.json({
      error: 'Failed to seed barbers',
      details: error.message,
      success: false
    }, { status: 500 });
  }
}