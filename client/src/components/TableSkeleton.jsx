import React from 'react';

const TableSkeleton = ({ rows = 5, columns = 4 }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <td key={colIndex} style={{ padding: '1rem' }}>
                            <div
                                className="skeleton"
                                style={{
                                    height: '20px',
                                    width: colIndex === 0 ? '40%' : '80%',
                                    marginBottom: '0'
                                }}
                            ></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};

export default TableSkeleton;
