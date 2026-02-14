// Schema Inspector Utility
// Use this to check your database schema from within the app

import { supabase } from '../services/supabase.service';

export interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

export interface TableSchema {
  table_schema: string;
  table_name: string;
  columns: TableColumn[];
}

export interface TableRelationship {
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  delete_rule: string;
}

class SchemaInspector {
  /**
   * Get complete schema information for all tables
   */
  async getSchema(): Promise<TableSchema[]> {
    const { data, error } = await supabase
      .from('db_schema')
      .select('*')
      .order('table_name');

    if (error) {
      if (__DEV__) console.error('Error fetching schema:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get schema for a specific table
   */
  async getTableSchema(tableName: string): Promise<TableSchema | null> {
    const { data, error } = await supabase
      .from('db_schema')
      .select('*')
      .eq('table_name', tableName)
      .single();

    if (error) {
      if (__DEV__) console.error(`Error fetching schema for ${tableName}:`, error);
      return null;
    }

    return data;
  }

  /**
   * Get all foreign key relationships
   */
  async getRelationships(): Promise<TableRelationship[]> {
    const { data, error } = await supabase
      .from('db_relationships')
      .select('*')
      .order('source_table');

    if (error) {
      if (__DEV__) console.error('Error fetching relationships:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Check if a column exists in a table
   */
  async columnExists(tableName: string, columnName: string): Promise<boolean> {
    const schema = await this.getTableSchema(tableName);
    if (!schema) return false;

    return schema.columns.some(col => col.column_name === columnName);
  }

  /**
   * Get a formatted string of the schema (for debugging)
   */
  async getSchemaString(): Promise<string> {
    const schema = await this.getSchema();
    let output = '=== DATABASE SCHEMA ===\n\n';

    for (const table of schema) {
      output += `📦 ${table.table_name}\n`;
      for (const col of table.columns) {
        const nullable = col.is_nullable === 'YES' ? '?' : '';
        const type = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        output += `  - ${col.column_name}${nullable}: ${type}\n`;
      }
      output += '\n';
    }

    return output;
  }

  /**
   * Log schema to console (for debugging)
   */
  async logSchema(): Promise<void> {
    const schemaString = await this.getSchemaString();
    if (__DEV__) console.log(schemaString);

    // Also log relationships
    const relationships = await this.getRelationships();
    if (__DEV__) console.log('=== RELATIONSHIPS ===');
    relationships.forEach(rel => {
      if (__DEV__) console.log(`${rel.source_table}.${rel.source_column} → ${rel.target_table}.${rel.target_column} (${rel.delete_rule})`);
    });
  }
}

// Export singleton instance
export const schemaInspector = new SchemaInspector();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).schemaInspector = schemaInspector;
  if (__DEV__) console.log('💡 Schema Inspector available! Try: window.schemaInspector.logSchema()');
}