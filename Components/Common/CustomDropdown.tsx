import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface DropdownItem {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  items: DropdownItem[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder: string;
  multiple?: boolean;
  maxHeight?: number;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  items,
  selectedValues,
  onSelectionChange,
  placeholder,
  multiple = false,
  maxHeight = 200,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemPress = (value: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onSelectionChange(newValues);
    } else {
      onSelectionChange([value]);
      setIsOpen(false);
    }
  };

  const handleDone = () => {
    setIsOpen(false);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const item = items.find(item => item.value === selectedValues[0]);
      return item?.label || selectedValues[0];
    }
    return `${selectedValues.length} items selected`;
  };

  const getSelectedItemsPreview = () => {
    if (selectedValues.length === 0) return '';
    if (selectedValues.length <= 2) {
      return selectedValues.map(value => {
        const item = items.find(item => item.value === value);
        return item?.label || value;
      }).join(', ');
    }
    const firstTwo = selectedValues.slice(0, 2).map(value => {
      const item = items.find(item => item.value === value);
      return item?.label || value;
    }).join(', ');
    return `${firstTwo} +${selectedValues.length - 2} more`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.dropdown, isOpen && styles.dropdownOpen]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.dropdownContent}>
          <Text style={[
            styles.dropdownText,
            selectedValues.length === 0 && styles.placeholderText
          ]}>
            {getDisplayText()}
          </Text>
          {selectedValues.length > 0 && multiple && (
            <Text style={styles.previewText} numberOfLines={1}>
              {getSelectedItemsPreview()}
            </Text>
          )}
        </View>
        <View style={styles.dropdownActions}>
          {selectedValues.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
            >
              <FontAwesome5 name="times" size={14} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>
          )}
          <FontAwesome5 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="rgba(255, 255, 255, 0.7)" 
          />
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.dropdownList, { maxHeight: maxHeight + 50 }]}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.dropdownItem,
                  selectedValues.includes(item.value) && styles.selectedItem
                ]}
                onPress={() => handleItemPress(item.value)}
              >
                <Text style={[
                  styles.itemText,
                  selectedValues.includes(item.value) && styles.selectedItemText
                ]}>
                  {item.label}
                </Text>
                {selectedValues.includes(item.value) && (
                  <FontAwesome5 name="check" size={16} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Footer with actions */}
          <View style={styles.footerContainer}>
            {multiple && selectedValues.length > 0 && (
              <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
                <FontAwesome5 name="trash" size={14} color="#666" />
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>
                Done {selectedValues.length > 0 && `(${selectedValues.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 56,
  },
  dropdownOpen: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dropdownContent: {
    flex: 1,
    marginRight: 12,
  },
  dropdownText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  previewText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '400',
  },
  dropdownActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    padding: 4,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f0f4ff',
  },
  itemText: {
    color: '#333333',
    fontSize: 15,
    flex: 1,
    fontWeight: '400',
  },
  selectedItemText: {
    color: '#667eea',
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  clearAllText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  doneButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomDropdown;