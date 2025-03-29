import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database Connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'CollegeDB',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Fetch timetable for a branch and year
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const year = searchParams.get('year');

    if (!branch || !year) {
        return NextResponse.json({ message: 'Branch and year are required' }, { status: 400 });
    }

    try {
        const [result] = await db.query('SELECT * FROM timetable WHERE branch = ? AND year = ?', [branch, year]);

        if (result.length === 0) {
            return NextResponse.json({ message: 'No timetable found' }, { status: 404 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error:any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Add a new timetable entry
export async function POST(req: NextRequest) {
    try {
        const { branch, year, time_slot, subject } = await req.json();
        await db.query('INSERT INTO timetable (branch, year, time_slot, subject) VALUES (?, ?, ?, ?)', [branch, year, time_slot, subject]);

        return NextResponse.json({ message: 'Timetable entry added successfully' }, { status: 201 });
    } catch (error:any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
