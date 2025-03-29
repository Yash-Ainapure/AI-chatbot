import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database Connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'CollegeDB',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function checkDBConnection() {
    try {
        const connection = await db.getConnection();
        console.log('✅ Database connected successfully!');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    }
}

checkDBConnection();

// Fetch all students
export async function GET(req: NextRequest) {
    try {
        const [students] = await db.query('SELECT * FROM students');
        return NextResponse.json(students, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Add a new student
export async function POST(req: NextRequest) {
    try {
        const { name, id, attendance_percentage } = await req.json();
        await db.query('INSERT INTO students (id, name, attendance_percentage) VALUES (?, ?, ?)', [id, name, attendance_percentage]);

        return NextResponse.json({ message: 'Student added successfully' }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
