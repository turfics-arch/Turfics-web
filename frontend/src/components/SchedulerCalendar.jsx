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
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                selectable
                onSelectEvent={onSelectEvent}
                onSelectSlot={onSelectSlot}
                popup
                eventPropGetter={(event) => ({
                    style: {
                        backgroundColor: event.color || '#3b82f6',
                        borderRadius: '4px',
                        opacity: 0.8,
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
