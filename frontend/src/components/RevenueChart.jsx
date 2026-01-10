import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const RevenueChart = ({ data }) => {
    // Determine dynamic height based on context or fix it
    const height = 300;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: '#222', border: '1px solid #444', padding: '10px', borderRadius: '4px' }}>
                    <p style={{ color: '#ccc', margin: 0 }}>{label}</p>
                    <p style={{ color: '#10b981', fontWeight: 'bold', margin: 0 }}>
                        ₹{payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ width: '100%', height: height, marginTop: '1rem', background: '#1a1a1a', borderRadius: '8px', padding: '1rem' }}>
            <h4 style={{ color: '#ccc', marginBottom: '1rem', marginTop: 0 }}>Monthly Revenue Trend</h4>
            <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#666"
                        tick={{ fontSize: 12 }}
                        tickFormatter={str => {
                            const d = new Date(str);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                    />
                    <YAxis
                        stroke="#666"
                        tick={{ fontSize: 12 }}
                        tickFormatter={val => `₹${val / 1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorPv)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;
