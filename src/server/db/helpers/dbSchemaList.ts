/**
 * dbSchemaList.
 *
 * @copyright 2020-present Inrae
 * @author mario.adam@inrae.fr
 *
 */

import { db } from "../../db";
import { IColList } from "../../types";



export const dbSchemaList = async(connectName: string):Promise<IColList> => {    
    const columns = await db[connectName].raw(`
  select c.table_schema, st.relname as TableName, c.column_name, c.data_type, c.is_nullable, pgd.description
  from pg_catalog.pg_statio_all_tables as st
  inner join information_schema.columns c
  on c.table_schema = st.schemaname
  and c.table_name = st.relname
  left join pg_catalog.pg_description pgd
  on pgd.objoid=st.relid
  and pgd.objsubid=c.ordinal_position`);

  return columns["rows"];
};