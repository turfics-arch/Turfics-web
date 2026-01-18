import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './SchedulerCalendar.css';

const localizer = momentLocalizer(moment);

const SchedulerCalendar = ({ events, onSelectEvent, onSelectSlot, defaultView = 'month' }) => {
    const [view, setView] = React.useState(defaultView);
    const [date, setDate] = React.useState(new Date());

    return (
        <div className="scheduler-calendar-container">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%', minHeight: '500px' }}
                onSelectEvent={onSelectEvent}
                onSelectSlot={onSelectSlot}
                selectable
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                views={['month', 'week', 'day', 'agenda']}
                eventPropGetter={(event) => ({
                    style: {
                        backgroundColor: event.color || '#3174ad',
                        borderRadius: '4px',
                        opacity: 0.9,
                        color: 'white',
                        border: '0px',
                        display: 'block'
                    }
                })}
            />
        </div>
    );
};

export default SchedulerCalendar;
