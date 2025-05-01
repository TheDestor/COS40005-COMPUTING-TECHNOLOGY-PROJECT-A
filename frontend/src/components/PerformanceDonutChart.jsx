import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import { Settings } from 'lucide-react';

const PerformanceDonutChart = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  // Performance data
  const data = [
    { name: 'Performance', value: 82.3, color: '#4ade80' },
    { name: 'Remaining', value: 17.7, color: '#f0f0f0' }
  ];
  
  // Additional metrics that can be displayed on tooltip/click
  const detailMetrics = [
    { name: 'CPU Efficiency', value: 88.2, unit: '%' },
    { name: 'Memory Optimization', value: 76.5, unit: '%' },
    { name: 'Disk I/O', value: 92.0, unit: '%' },
    { name: 'Network Throughput', value: 72.7, unit: '%' }
  ];

  const getStatusColor = (value) => {
    if (value >= 80) return '#4ade80'; // Green for good
    if (value >= 60) return '#facc15'; // Yellow for warning
    return '#f87171'; // Red for poor
  };

  const getStatusText = (value) => {
    if (value >= 80) return 'Good';
    if (value >= 60) return 'Average';
    return 'Poor';
  };

  const onPieEnter = (_, index) => {
    setHoveredIndex(index);
  };

  const onPieLeave = () => {
    setHoveredIndex(null);
  };

  const onPieClick = (_, index) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      if (payload[0].name === "Remaining") return null;
      
      return (
        <div className="bg-white p-3 shadow-lg rounded-md border border-gray-200">
          <h4 className="font-semibold text-gray-900">Overall Performance</h4>
          <p className="text-lg font-bold text-gray-800">{payload[0].value.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Click for details</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center bg-white rounded-lg shadow-md p-4 h-full">
      <div className="w-full flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Overall Performance</h3>
        <Settings className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700" />
      </div>
      
      <div className="relative w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={hoveredIndex !== null ? hoveredIndex : activeIndex}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={0}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              onClick={onPieClick}
              animationDuration={800}
              animationBegin={0}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-3xl font-bold" style={{ color: getStatusColor(data[0].value) }}>
            {data[0].value}%
          </div>
          <div className="text-lg font-medium" style={{ color: getStatusColor(data[0].value) }}>
            {getStatusText(data[0].value)}
          </div>
        </div>
      </div>

      {activeIndex === 0 && (
        <div className="mt-4 w-full">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Breakdown</h4>
          <div className="space-y-2">
            {detailMetrics.map((metric, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{metric.name}</span>
                  <span className="text-sm font-medium" style={{ color: getStatusColor(metric.value) }}>
                    {metric.value}{metric.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${metric.value}%`, 
                      backgroundColor: getStatusColor(metric.value) 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDonutChart;