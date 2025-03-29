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

// Fetch attendance of a specific student
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;

    try {
        const [result] = await db.query('SELECT name, attendance_percentage FROM students WHERE id = ?', [id]);
        
        if (result.length === 0) {
            return NextResponse.json({ message: 'Student not found' }, { status: 404 });
        }

        return NextResponse.json(result[0], { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
