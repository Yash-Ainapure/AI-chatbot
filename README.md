tasks

a dummy college website.

API	Method	URL	Description
Get all students	GET	/api/students	Fetch all students
Add a new student	POST	/api/students	Add a student (send { id, name, attendance_percentage } in body)
Get student attendance	GET	/api/students/[id]	Fetch specific student attendance
Get timetable	GET	/api/timetable?branch=CSE&year=2	Fetch timetable for CSE 2nd year
Add timetable entry	POST	/api/timetable	Add a timetable entry (send { branch, year, time_slot, subject } in body)

