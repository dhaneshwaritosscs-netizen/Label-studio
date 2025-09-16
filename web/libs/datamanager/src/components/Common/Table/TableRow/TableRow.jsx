import { observer } from "mobx-react";
import React, { useState } from "react";
import { cn } from "../../../../utils/bem";
import { FF_LOPS_E_3, isFF } from "../../../../utils/feature-flags";
import { normalizeCellAlias } from "../../../CellViews";
import "./TableRow.scss";
import { TableContext, tableCN } from "../TableContext";
import { getProperty, getStyle } from "../utils";

const CellRenderer = observer(({ col: colInput, data, decoration, cellViews }) => {
  const { Header: _, Cell, id, ...col } = colInput;

  if (Cell instanceof Function) {
    const { headerClassName: _, cellClassName, ...rest } = col;

    return (
      <span className={tableCN.elem("cell").mix(cellClassName).toString()} {...rest} key={id}>
        <Cell data={data} />
      </span>
    );
  }

  const valuePath = id.split(":")[1] ?? id;
  const altType = normalizeCellAlias(valuePath);
  const value = getProperty(data, valuePath);

  const Renderer = cellViews[altType] ?? cellViews[col.original.currentType] ?? cellViews.String;
  const renderProps = { column: col, original: data, value };
  const Decoration = decoration?.get?.(col);
  const style = getStyle(cellViews, col, Decoration);
  const cellIsLoading = isFF(FF_LOPS_E_3) && data.loading === colInput.alias;

  return (
    <div className={tableCN.elem("cell").toString()}>
      <div
        style={{
          ...(style ?? {}),
          display: "inline-flex",
          height: "100%",
          alignItems: cellIsLoading ? "" : "center",
          color: "black",
        }}
      >
        {Renderer ? <Renderer {...renderProps} /> : value}
      </div>
    </div>
  );
});

export const TableRow = observer(({ data, even, style, wrapperStyle, onClick, stopInteractions, decoration }) => {
  const { columns, cellViews } = React.useContext(TableContext);
  const rowWrapperCN = tableCN.elem("row-wrapper");
  const tableRowCN = cn("table-row");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const mods = {
    even,
    selected: data.isSelected,
    highlighted: data.isHighlighted,
    loading: data.isLoading,
    disabled: stopInteractions,
  };

  // Find specific columns for card layout
  const selectColumn = columns.find(col => col.id === 'select');
  const showSourceColumn = columns.find(col => col.id === 'show-source');
  const idColumn = columns.find(col => col.id === 'id' || col.alias === 'id');
  const imageColumn = columns.find(col => col.id === 'image' || col.alias === 'image');
  
  // Get all other columns (excluding select, show-source, id, image)
  const otherColumns = columns.filter(col => 
    col.id !== 'select' && 
    col.id !== 'show-source' && 
    col.id !== 'id' && 
    col.alias !== 'id' &&
    col.id !== 'image' && 
    col.alias !== 'image'
  );

  // Find specific columns for better layout
  const completedColumn = otherColumns.find(col => col.id === 'completed' || col.alias === 'completed' || col.id === 'completed_at');
  const annotatorsColumn = otherColumns.find(col => col.id === 'annotators' || col.alias === 'annotators' || col.id === 'annotated_by');

  // Handle task deletion
  const handleDeleteTask = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isDeleting) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this task? This action cannot be undone.');
    if (!confirmed) return;
    
    setIsDeleting(true);
    
    try {
      // Get project ID from URL or context
      const projectId = window.location.pathname.match(/\/projects\/(\d+)/)?.[1];
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      
      // Call the delete_tasks action API
      const response = await fetch(`/api/dm/actions?id=delete_tasks&project=${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedItems: {
            all: false,
            included: [data.id]
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      
      const result = await response.json();
      
      // Remove the task from the UI by reloading the page
      window.location.reload();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle three-dots menu click
  const handleMenuClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.task-menu-container')) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  return (
    <div className={rowWrapperCN.mod(mods).toString()} style={{...wrapperStyle, position: 'relative'}} onClick={(e) => onClick?.(data, e)}>
      <div className={tableRowCN.toString()} style={style} data-leave={true}>
        {/* Checkbox in top-right corner */}
        <div className="task-checkbox-container" style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10
        }}>
          {selectColumn && (
            <CellRenderer col={selectColumn} data={data} cellViews={cellViews} decoration={decoration} />
          )}
        </div>

        {/* Three-dots menu in top-right corner */}
        <div className="task-menu-container" style={{
          position: 'absolute',
          top: '12px',
          right: '48px',
          zIndex: 10
        }}>
          <button
            onClick={handleMenuClick}
            style={{
              background: 'rgb(25 44 89)',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              color: '#6b7280',
              fontSize: '16px',
              lineHeight: '1'
            }}
            onMouseEnter={(e) => {
              e.target.style.setProperty('background-color', 'rgb(25 44 89)', 'important');
              e.target.style.setProperty('background', 'rgb(25 44 89)', 'important');
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.setProperty('background-color', 'rgb(25 44 89)', 'important');
              e.target.style.setProperty('background', 'rgb(25 44 89)', 'important');
              e.target.style.color = '#6b7280';
            }}
          >
            :
          </button>
          
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '25px',
             // left: '10%',
              marginLeft: '4px',
              backgroundColor: 'rgb(25 44 89)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              minWidth: '120px',
              zIndex: 20
            }}>
              <button
                onClick={handleDeleteTask}
                disabled={isDeleting}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'rgb(25 44 89)',  
                  textAlign: 'left',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  color: isDeleting ? '#9ca3af' : '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.target.style.backgroundColor = 'rgb(25 44 89)';
                    e.target.style.opacity = '0.8';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgb(25 44 89)';
                  e.target.style.opacity = '1';
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        {/* Image Section - Top of Card */}
        {imageColumn && (
          <div style={{ 
            marginBottom: '16px', 
            borderRadius: '12px', 
            overflow: 'hidden',
            width: '100%',
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            position: 'relative',
            padding: '20px'
          }}>
            <div style={{
              width: '240px',
              height: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <CellRenderer col={imageColumn} data={data} cellViews={cellViews} decoration={decoration} />
            </div>
          </div>
        )}

        {/* ID Section */}
        {idColumn && (
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
            ID: {data.id}
          </div>
        )}

        {/* Date Section */}
        <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '400', marginBottom: '12px' }}>
          Date: {completedColumn ? (
            completedColumn.Cell ? (
              <CellRenderer col={completedColumn} data={data} cellViews={cellViews} decoration={decoration} />
            ) : (
              new Date(data.completed_at || data.completed || data.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
            )
          ) : (
            new Date(data.completed_at || data.completed || data.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          )}
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            background: data.isCompleted || data.completed_at ? '#10b981' : '#f59e0b',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {data.isCompleted || data.completed_at ? '✓' : '★'} {data.isCompleted || data.completed_at ? 'Completed' : 'Annotated'}
          </div>
        </div>

        {/* Annotated By Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
          <span style={{ fontWeight: '500' }}>Annotated By:</span>
          {annotatorsColumn ? (
            <CellRenderer col={annotatorsColumn} data={data} cellViews={cellViews} decoration={decoration} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                backgroundColor: '#e5e7eb', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280'
              }}>
                DH
              </div>
              <span style={{ fontSize: '14px', color: '#374151' }}>DH Dhaneshwari</span>
            </div>
          )}
          <div style={{ marginLeft: 'auto', cursor: 'pointer' }}>
           {/* <span style={{ fontSize: '16px', color: '#9ca3af' }}>⋯</span> */}
          </div>
        </div>

      </div>
    </div>
  );
});
