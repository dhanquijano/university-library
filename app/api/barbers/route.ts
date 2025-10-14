import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { barbers } from '@/database/schema';
import fs from 'fs';
import path from 'path';

// GET: List all barbers (database first, fallback to JSON)
export async function GET(req: NextRequest) {
  try {
    let barbersData;
    
    try {
      // Try to read from database first
      const dbBarbers = await db.select().from(barbers);
      
      if (dbBarbers && dbBarbers.length > 0) {
        console.log(`Found ${dbBarbers.length} barbers in database`);
        
        // Transform database barbers to expected format
        barbersData = dbBarbers.map((barber: any) => {
          let specialties = [];
          let branches = [];
          
          try {
            specialties = typeof barber.specialties === 'string' 
              ? JSON.parse(barber.specialties) 
              : (Array.isArray(barber.specialties) ? barber.specialties : []);
          } catch (e) {
            console.warn(`Failed to parse specialties for barber ${barber.id}:`, barber.specialties);
            specialties = [];
          }
          
          try {
            branches = typeof barber.branches === 'string' 
              ? JSON.parse(barber.branches) 
              : (Array.isArray(barber.branches) ? barber.branches : []);
          } catch (e) {
            console.warn(`Failed to parse branches for barber ${barber.id}:`, barber.branches);
            branches = [];
          }
          
          return {
            id: barber.id,
            name: barber.name,
            specialties,
            experience: barber.experience,
            rating: parseFloat(barber.rating) || 0,
            image: barber.image,
            branches,
            createdAt: barber.createdAt
          };
        });
      } else {
        throw new Error('No barbers found in database');
      }
      
    } catch (dbError) {
      console.log('Database not available, falling back to JSON file');
      
      // Fallback to barbers.json if database fails
      const barbersFilePath = path.join(process.cwd(), 'public', 'barbers.json');
      barbersData = JSON.parse(fs.readFileSync(barbersFilePath, 'utf8'));
    }
    
    return NextResponse.json(barbersData);
  } catch (error) {
    console.error('Error fetching barbers:', error);
    return NextResponse.json({ error: 'Failed to fetch barbers' }, { status: 500 });
  }
}

// POST: Add a new barber (to database if available, otherwise just return error)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Transform data for database storage
    const barberData = {
      name: data.name,
      specialties: JSON.stringify(data.specialties || []),
      experience: data.experience || '',
      rating: data.rating?.toString() || '0',
      image: data.image || '',
      branches: JSON.stringify(data.branches || []),
    };
    
    const [barber] = await db.insert(barbers).values(barberData).returning();
    
    // Transform back to expected format
    let specialties = [];
    let branches = [];
    
    try {
      specialties = JSON.parse(barber.specialties);
    } catch (e) {
      specialties = [];
    }
    
    try {
      branches = JSON.parse(barber.branches);
    } catch (e) {
      branches = [];
    }
    
    const responseBarber = {
      id: barber.id,
      name: barber.name,
      specialties,
      experience: barber.experience,
      rating: parseFloat(barber.rating) || 0,
      image: barber.image,
      branches,
      createdAt: barber.createdAt
    };
    
    return NextResponse.json(responseBarber);
  } catch (error) {
    console.error('Error creating barber:', error);
    return NextResponse.json({ error: 'Failed to create barber' }, { status: 500 });
  }
}