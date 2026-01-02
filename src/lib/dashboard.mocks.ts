import type {
  DashboardKpi,
  ClientOverviewPoint,
  RevenuePoint,
  ActivityOverview,
  TrainerSchedule,
  MaintenanceReport,
  ClientClass,
  RecentActivity,
  CalendarEvent,
} from '@/types/dashboard.types'

export const mockKpis: DashboardKpi[] = [
  {
    id: '1',
    title: 'Total Revenue',
    value: 1287,
    subtitle: 'Total revenue today',
    delta: 2.14,
    deltaType: 'increase',
    icon: 'revenue',
  },
  {
    id: '2',
    title: 'Total Clients',
    value: 965,
    subtitle: 'Active clients today',
    delta: 3.78,
    deltaType: 'increase',
    icon: 'clients',
  },
  {
    id: '3',
    title: 'Classes Booked',
    value: 128,
    subtitle: 'Classes scheduled today',
    delta: 1.56,
    deltaType: 'decrease',
    icon: 'classes',
  },
  {
    id: '4',
    title: 'Gym Equipment Available',
    value: 315,
    subtitle: 'Equipment available now',
    delta: 1.64,
    deltaType: 'increase',
    icon: 'equipment',
  },
]

export const mockClientOverview: ClientOverviewPoint[] = [
  { date: '4 Jul', child: 40, adult: 80, elderly: 20 },
  { date: '5 Jul', child: 35, adult: 75, elderly: 25 },
  { date: '6 Jul', child: 45, adult: 90, elderly: 30 },
  { date: '7 Jul', child: 105, adult: 132, elderly: 38 },
  { date: '8 Jul', child: 60, adult: 110, elderly: 35 },
  { date: '9 Jul', child: 50, adult: 95, elderly: 28 },
  { date: '10 Jul', child: 55, adult: 100, elderly: 32 },
  { date: '11 Jul', child: 48, adult: 85, elderly: 26 },
]

export const mockRevenue: RevenuePoint[] = [
  { day: 'Sun', income: 800, expense: 400 },
  { day: 'Mon', income: 1200, expense: 600 },
  { day: 'Tue', income: 900, expense: 500 },
  { day: 'Wed', income: 1495, expense: 700 },
  { day: 'Thu', income: 1100, expense: 550 },
  { day: 'Fri', income: 1300, expense: 650 },
  { day: 'Sat', income: 1000, expense: 480 },
]

export const mockActivityOverview: ActivityOverview = {
  total: 1890,
  period: 'This Week',
  breakdown: [
    { name: 'Yoga Classes', value: 662, percentage: 35, color: '#1a1a2e' },
    { name: 'Strength Training', value: 529, percentage: 28, color: '#b8e986' },
    { name: 'Cardio Workouts', value: 378, percentage: 20, color: '#e8e8e8' },
    { name: 'Other Activities', value: 321, percentage: 17, color: '#f0f0f0' },
  ],
}

export const mockTrainerSchedule: TrainerSchedule[] = [
  {
    id: '1',
    name: 'John Smith',
    role: 'Yoga Instructor',
    activity: 'Yoga Class',
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    status: 'available',
  },
  {
    id: '2',
    name: 'Emma Brown',
    role: 'CrossFit Trainer',
    activity: 'CrossFit',
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    status: 'unavailable',
  },
  {
    id: '3',
    name: 'Jake Taylor',
    role: 'Fitness Coach',
    activity: 'Strength Training',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    status: 'available',
  },
  {
    id: '4',
    name: 'Sophia Lee',
    role: 'Aerobics Instructor',
    activity: 'Cardio Workouts',
    startTime: '11:00 AM',
    endTime: '02:00 PM',
    status: 'available',
  },
  {
    id: '5',
    name: 'Liam White',
    role: 'Personal Trainer',
    activity: 'Personal Training',
    startTime: '02:00 PM',
    endTime: '05:00 PM',
    status: 'unavailable',
  },
]

export const mockReports: MaintenanceReport[] = [
  {
    id: '1',
    title: 'Treadmill Requires Cleaning',
    timeAgo: '3 minutes ago',
    icon: 'cleaning',
  },
  {
    id: '2',
    title: 'Weight Machine Maintenance',
    timeAgo: '3 minutes ago',
    icon: 'maintenance',
  },
  {
    id: '3',
    title: 'Sanitization Supplies Restock',
    timeAgo: '5 minutes ago',
    icon: 'restock',
  },
  {
    id: '4',
    title: 'Air Conditioning Maintenance',
    timeAgo: '1 hour ago',
    icon: 'hvac',
  },
  {
    id: '5',
    title: 'Equipment Relocation Needed',
    timeAgo: 'Yesterday',
    icon: 'relocation',
  },
]

export const mockClientClasses: ClientClass[] = [
  {
    id: '1',
    name: 'Caren G. Simpson',
    date: '20-07-28',
    time: '09:00 AM',
    trainer: 'Jake Taylor',
    className: 'Yoga Session',
    status: 'confirmed',
  },
  {
    id: '2',
    name: 'Edgar Warrow',
    date: '20-07-28',
    time: '10:30 AM',
    trainer: 'Olivia Martinez',
    className: 'Cardio Workout',
    status: 'confirmed',
  },
  {
    id: '3',
    name: 'Ocean Jane Lupre',
    date: '20-07-28',
    time: '11:00 AM',
    trainer: 'Damian Sanchez',
    className: 'Strength Training',
    status: 'pending',
  },
  {
    id: '4',
    name: 'Shane Riddick',
    date: '20-07-28',
    time: '01:00 PM',
    trainer: 'Chloe Harrington',
    className: 'Personal Training',
    status: 'cancelled',
  },
  {
    id: '5',
    name: 'Queen Lawnston',
    date: '20-07-28',
    time: '02:30 PM',
    trainer: 'Petra Winsburry',
    className: 'Yoga Session',
    status: 'confirmed',
  },
]

export const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    message: 'John Doe finished his session in Free Weights.',
    time: '08:30 AM',
    type: 'session',
  },
  {
    id: '2',
    message: 'Rowing machine is scheduled for maintenance.',
    time: '09:00 AM',
    type: 'maintenance',
  },
  {
    id: '3',
    message: 'Emergency repairs needed for leg press equipment.',
    time: '10:00 AM',
    type: 'alert',
  },
  {
    id: '4',
    message: 'Emergency repairs needed for leg press equipment.',
    time: '11:00 AM',
    type: 'alert',
  },
  {
    id: '5',
    message: 'Rowing machine is scheduled for maintenance.',
    time: '01:15 PM',
    type: 'maintenance',
  },
]

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Morning Staff Briefing',
    startTime: '08:00',
    endTime: '09:00',
    color: '#b8e986',
  },
  {
    id: '2',
    title: 'Client Consultation',
    startTime: '10:00',
    endTime: '12:00',
    color: '#b8e986',
  },
  {
    id: '3',
    title: 'Strength Training',
    startTime: '01:00',
    endTime: '03:00',
    color: '#b8e986',
  },
  {
    id: '4',
    title: 'Advanced HIIT',
    startTime: '04:00',
    endTime: '05:00',
    color: '#b8e986',
  },
]
