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

// Fetch all student attendance records
export async function GET(req: NextRequest) {
    try {
        const [attendance] = await db.query('SELECT * FROM studentAttendance');
        return NextResponse.json(attendance, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Add a new attendance record
export async function POST(req: NextRequest) {
    try {
        const { studentId, date, status } = await req.json();
        await db.query('INSERT INTO studentAttendance (studentId, date, status) VALUES (?, ?, ?)', 
            [studentId, date, status]);

        return NextResponse.json({ message: 'Attendance recorded successfully' }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update an existing attendance record
export async function PUT(req: NextRequest) {
    try {
        const { studentId, date, status } = await req.json();
        const [result] = await db.query(
            'UPDATE studentAttendance SET status = ? WHERE studentId = ? AND date = ?',
            [status, studentId, date]
        );

        if ((result as any).affectedRows === 0) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        return NextResponse.json({ message: 'Attendance updated successfully' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete an attendance record
export async function DELETE(req: NextRequest) {
    try {
        const { studentId, date } = await req.json();
        const [result] = await db.query(
            'DELETE FROM studentAttendance WHERE studentId = ? AND date = ?',
            [studentId, date]
        );

        if ((result as any).affectedRows === 0) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        return NextResponse.json({ message: 'Attendance deleted successfully' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
