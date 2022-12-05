import { isGraph, _DBDATAS, _ENTITIES } from "../../db/constants";
import {  getEntityName,   getReturnFormat, removeQuotes } from "../../helpers";
import { IKeyValues, returnFormat, TimeSeriesType } from "../../types";
import { Token } from "../parser/lexer";
import { Literal } from "../parser/literal";
import { SQLLiteral } from "../parser/sqlLiteral";
import { SqlOptions } from "../parser/sqlOptions";
import koa from "koa";
import { logDebug, message } from "../../logger";
import { createGetSql, createPostSql, oDatatoDate } from "./helper";
import { Knex } from "knex";

export interface PGQuery {
    from: string;
    select: string;
    where?: string;
    orderby?: string;
    groupBy?: string;
    skip?: number;
    limit?: number;
}

export class PgVisitor {
    public options: SqlOptions;
    public entity: string = "";
    parentEntity: string | undefined = undefined;
    extras: undefined;
    timeSeries?: TimeSeriesType;
    // property: string | undefined = undefined;
    relation: string | undefined = undefined;
    id: bigint | string = BigInt(0);
    parentId: bigint | string = BigInt(0);
    select: string = "";
    ArrayNames: { [key: string]: string } = {} ;
    where: string = "";
    orderby: string = "id, ";
    groupBy: string[] = [];
    expand: string[] = [];
    splitResult: string[] | undefined;
    skip: number = 0;
    limit: number = 0;
    debug: boolean = false;
    count: boolean = false;
    ref: boolean = false;
    value: boolean = false;
    InlineCount: boolean;
    navigationProperty: string;
    resultFormat: returnFormat = getReturnFormat("json");
    includes: PgVisitor[] = [];
    parameters: unknown[] = [];
    ast: Token;
    showRelations: boolean = true;
    test: boolean = !true;

    constructor(options = <SqlOptions>{}, blank?: boolean) {
        this.options = options;
        this.ref = options.ref;
        this.value = options.value;
        if (this.value  === true) this.resultFormat = getReturnFormat("txt");        
    }
    
    
// ***********************************************************************************************************************************************************************
// ***                                                           ROSSOURCES                                                                                            ***
// ***********************************************************************************************************************************************************************
    public setEntity(input: string) { this.entity = input; }
    public getEntity()  { return this.entity; } 
    
    addToArrayNames(key:string, value?:string) {
         this.ArrayNames[key] = value ? value : `"${key}"`;
    }
    
    init(ctx: koa.Context, node: Token) {
        message(true, "HEAD", "INIT PgVisitor");
        const temp = this.VisitRessources(node);
        logDebug(temp);
        this.verifyRessources(ctx);
        return temp;
    }

    verifyRessources = (ctx: koa.Context): void => {
        message(true, "HEAD", "verifyRessources");
        // TODO REMOVE AFTER ALL 
        
        if (this.entity.toUpperCase() === "LORA") this.setEntity("Loras");
        if (this.parentEntity) {
            if (!_DBDATAS[this.parentEntity].relations[this.entity])  ctx.throw(404, { detail:`Invalid path ${this.entity.trim()}` }); 
            
            
        } else if (!_DBDATAS[this.entity])  ctx.throw(404, { detail:`Invalid path ${this.entity.trim()}` }); 
    
    }

    VisitRessources(node: Token, context?: any) {
            var ressource = this[`VisitRessources${node.type}`]; 
            if (this.test == true) {
                console.log(`Ressource Visit ==========================> VisitRessources${node.type}`);            
                console.log(node);
                console.log(context);          
            }           
            if (ressource) ressource.call(this, node, context);
            else{
                console.log(`Ressource Not Found ============> VisitRessources${node.type}`);            
                throw new Error(`Unhandled node type: ${node.type}`);
            }
        return this;
    }

    protected VisitRessourcesResourcePath(node: Token, context: any) {
        if (node.value.resource && node.value.resource.type == 'EntitySetName') {
            this.entity= node.value.resource.raw;
        }
        if (node.value.navigation) this.VisitRessources(node.value.navigation, context);
    }

    protected VisitRessourcesEntitySetName(node: Token, context: any) { 
        this.entity= node.value.raw;        
    }

    protected VisitRessourcesRefExpression(node: Token, context: any) {
        if (node.type == "RefExpression" && node.raw == '/$ref') this.ref = true;        
    }

    protected VisitRessourcesValueExpression(node: Token, context: any) {
        if (node.type == "ValueExpression" && node.raw == '/$value') this.value = true;        
    }

    protected VisitRessourcesCollectionNavigation(node: Token, context: any) {           
        if (node.value.path) this.VisitRessources(node.value.path, context);
    }

    protected VisitRessourcesCollectionNavigationPath(node: Token, context: any) {
        if (node.value.predicate) this.VisitRessources(node.value.predicate, context);
        if (node.value.navigation) this.VisitRessources(node.value.navigation, context);
    }

    protected VisitRessourcesSimpleKey(node: Token, context: any) {
        if (node.value.value.type === "KeyPropertyValue") this.VisitRessources(node.value.value, context);
    }

    protected VisitRessourcesKeyPropertyValue(node: Token, context: any) {
        this.id = this.options.loraId ? this.options.loraId :  node.value == "Edm.SByte" ? BigInt(node.raw) : node.raw;  
        this.where = this.options.loraId ? `"lora"."deveui" = '${this.options.loraId}'` : `id = ${this.id}`;              
    }
    
    protected VisitRessourcesSingleNavigation(node: Token, context: any) {
        if (node.value.path && node.value.path.type === "PropertyPath") this.VisitRessources(node.value.path, context);   
    }

    protected VisitRessourcesPropertyPath(node: Token, context: any) {
        if (node.type == "PropertyPath") {
            if (_DBDATAS[this.entity].relations[node.raw]) {
                this.where = _DBDATAS[this.entity].relations[node.raw].link.split("$ID").join(<string>this.id);
                this.parentEntity = this.entity;
                this.entity  = node.raw;
                this.parentId = this.id;
                this.id = BigInt(0);
            } else if (_DBDATAS[this.entity].columns[node.raw]) {
                    this.select = node.raw; 
                    this.showRelations = false;
                    // SPACE IS VERY IMPORTANT TO PROVOQUE ERROR
            } else this.entity = ` ${node.raw}`;
        }    
    }

    protected VisitRessourcesODataUri(node: Token, context: any) {
        this.VisitRessources(node.value.resource, context);
        this.VisitRessources(node.value.query, context);
    }

   
    asGetSql(): string { 
        return createGetSql(this);    
    } 

    asPatchSql(datas: IKeyValues[] | IKeyValues, knexInstance: Knex | Knex.Transaction): string { 
        return createPostSql(datas, knexInstance , this);    
    }  

    asPostSql(datas: IKeyValues[] | IKeyValues, knexInstance: Knex | Knex.Transaction): string { 
        return createPostSql(datas, knexInstance , this);    
    }  

// ***********************************************************************************************************************************************************************
// ***                                                              QUERY                                                                                              ***
// ***********************************************************************************************************************************************************************

    start(ctx: koa.Context, node: Token) {
        message(true, "HEAD", "Start PgVisitor");
        const temp = this.Visit(node);
        logDebug(temp);this.verifyQuery(ctx);
        return temp;
    }

    verifyQuery = (ctx: koa.Context): void => {
        message(true, "HEAD", "verifyQuery");
        if (this.select.length > 0) {
            const cols = [...Object.keys(_DBDATAS[this.entity].columns), ...Object.keys(_DBDATAS[this.entity].relations)]
            
            this.select.split(",").filter((e:string) => e.trim() != "").forEach((element:string) => {
                const test = removeQuotes(element);   
                if (!cols.includes(test))  ctx.throw(404, { detail:`Invalid name ${test}` });   
            }); 
        }
        const expands: string[] = [];
        this.includes.forEach((element: PgVisitor) => {
            if (element.ast.type === "ExpandItem") expands.push(element.ast.raw.split("(")[0]);
        });
        
        expands.forEach((elem:string) => {
            const elems = elem.split("/");
            elems.unshift(this.entity);     
            if(elems[0]) {            
                if (!Object.keys(_DBDATAS[elems[0]].relations).includes(elems[1]) )  ctx.throw(400, { detail:`Invalid expand path ${elems[1]} for ${elems[0]}` });  
            }  else  ctx.throw(400, { detail:`Invalid entity ${elems[0]}` });  
        });    
        
        if(this.entity === _DBDATAS.Observations.name && this.splitResult !== undefined && Number(this.parentId) == 0) {
            ctx.throw(400, { detail:`Split result not allowed for Observations entity use /Datastreams/Observations or /MultiDatastreams/Observations` }); 
        }

        if(this.entity === _DBDATAS.MultiDatastreams.name && this.timeSeries !== undefined) {
            if (!this.splitResult || this.splitResult.length !== 1 ||  this.splitResult[0].toUpperCase() === 'ALL')  ctx.throw(400, { detail:`You must use SplitResult to identify one key result` }); 
        }
        
        if((this.entity === _DBDATAS.Observations.name && !this.parentEntity) && this.timeSeries !== undefined) {
            ctx.throw(400, { detail: `Series not allowed for Observations entity use /Datastreams/Observations or /MultiDatastreams/Observations With SplitResult` }); 
        }
        if(this.resultFormat.name === "DATAARRAY" && BigInt(this.id) > 0 && !this.parentEntity ) {
            ctx.throw(400, { detail: `DataArray not allowed` }); 

        }

    }

    Visit(node: Token, context?: any) {
        this.ast = this.ast || node;
        context = context || { target: "where" };

        if (node) {
            var visitor = this[`Visit${node.type}`];            
            if (this.test == true) {
                console.log(`VISIT =============================================> Visit${node.type}`);              
                console.log(node);
                console.log(context);          
                console.log(`Where : ${this.where}`);          
            }
            if (visitor) {
                visitor.call(this, node, context);
                if (this.test == true) {
                    console.log(`AFTER  Visit${node.type} Where : ${this.where}`);          
                    console.log(`AFTER  Visit${node.type} Select : ${this.select}`);        
                }  
            }
            else { 
                console.log(`ERROR =================> Visit${node.type}`);            
                console.log(node); throw new Error(`Unhandled node type: ${node.type}`);
            }
        }

        if (node == this.ast) {
            if (this.entity.startsWith("Lora")) {              
                if (typeof this.id == "string") {
                    this.where = `"lora"."deveui" = '${this.id}'`;
                }
            };
        }
        return this;
    }

    protected VisitExpand(node: Token, context: any) {
        node.value.items.forEach((item: Token) => {
          let expandPath = item.value.path.raw;
          
          let visitor = this.includes.filter(v => v.navigationProperty == expandPath)[0];
          
          if (!visitor) {
            visitor = new PgVisitor({...this.options});
            this.includes.push(visitor);
          }
          visitor.Visit(item);
        });
      }

    protected VisitEntity(node: Token, context: any) {
        this.Visit(node.value.path, context);
        if (node.value.options) node.value.options.forEach((item: Token) => this.Visit(item, context));
        this.splitResult = node.value.split;
    }

    protected VisitSplitResult(node: Token, context: any) {
        this.Visit(node.value.path, context);
        if (node.value.options) node.value.options.forEach((item: Token) => this.Visit(item, context));
        this.splitResult = node.value.split(",");
    }

    protected VisitresultFormat(node: Token, context: any) {
        this.Visit(node.value.path, context);
        if (node.value.options) node.value.options.forEach((item: Token) => this.Visit(item, context));
    }

    protected VisitDebug(node: Token, context: any) {      
        this.Visit(node.value.path, context);
        if (node.value.options) node.value.options.forEach((item: Token) => this.Visit(item, context));
        this.debug = node.value.raw;
    }

    protected VisitResultFormat(node: Token, context: any) {      
        if (node.value.format) this.resultFormat = getReturnFormat(node.value.format);
        if (isGraph(this)) this.showRelations = false;
    }

    protected VisitTimeSeries(node: Token, context: any) {      
        if (node.value.serie) {
            this.timeSeries = node.value.serie;
            this.showRelations = false;
        }
    }

    protected VisitExpandItem(node: Token, context: any) {   
        this.Visit(node.value.path, context);
        if (node.value.options) node.value.options.forEach((item: Token) => this.Visit(item, context));
    }

    protected VisitExpandPath(node: Token, context: any) {
        this.navigationProperty = node.raw;
    }

    // Start loop process
    protected VisitQueryOptions(node: Token, context: any) {
        node.value.options.forEach((option: any) => this.Visit(option, context));
    }

    protected VisitInlineCount(node: Token, context: any) {
        this.InlineCount = Literal.convert(node.value.value, node.value.raw);
    }

    protected VisitFilter(node: Token, context: any) {
        if (this.where.trim() != "") this.where += " AND "
        context.target = "where";
        this.Visit(node.value, context);
    }

    protected VisitOrderBy(node: Token, context: any) {
        context.target = "orderby";
        node.value.items.forEach((item: Token, i: number) => {
            this.Visit(item, context);
            if (i < node.value.items.length - 1) this.orderby += ", ";
        });
    }

    protected VisitOrderByItem(node: Token, context: any) {
        this.Visit(node.value.expr, context);
        this.orderby += node.value.direction > 0 ? " ASC" : " DESC";
    }

    protected VisitSkip(node: Token, context: any) {
        this.skip = +node.value.raw;
    }

    protected VisitTop(node: Token, context: any) {
        this.limit = +node.value.raw;
    }

    protected VisitSelect(node: Token, context: any) {
        context.target = "select";
        node.value.items.forEach((item: Token, i: number) => {
            this.Visit(item, context);
        });
    }

    protected VisitSelectItem(node: Token, context: any) {
        context.identifier = node.raw;     
        this[context.target] += `"${node.raw}",`;
        this.showRelations = false;        
    }

    protected VisitAndExpression(node: Token, context: any) {
        this.Visit(node.value.left, context);
        this.where += " AND ";
        this.Visit(node.value.right, context);
    }

    protected VisitOrExpression(node: Token, context: any) {
        this.Visit(node.value.left, context);
        this.where += " OR ";
        this.Visit(node.value.right, context);
    }

    protected VisitNotExpression(node: Token, context: any) {
        this.where += " NOT ";
        this.Visit(node.value, context);
    }

    protected VisitBoolParenExpression(node: Token, context: any) {
        this.where += "(";
        this.Visit(node.value, context);
        this.where += ")";
    }

    protected VisitCommonExpression(node: Token, context: any) {
        this.Visit(node.value, context);
    }

    protected VisitFirstMemberExpression(node: Token, context: any) {
        this.Visit(node.value, context);
    }

    protected VisitMemberExpression(node: Token, context: any) {
        this.Visit(node.value, context);
    }

    protected VisitPropertyPathExpression(node: Token, context: any) {
        if (node.value.current && node.value.next) {
            // deterwine if its column AND JSON
            if (_DBDATAS[this.entity].columns[node.value.current.raw] && _DBDATAS[this.entity].columns[node.value.current.raw].create.startsWith("json") && node.value.next.raw[0]=="/") {
                this.where += `"${node.value.current.raw}"->>'${node.value.next.raw.slice(1)}'`;
            } else {
                this.Visit(node.value.current, context);
                context.identifier += ".";
                this.Visit(node.value.next, context);
            }
        } else this.Visit(node.value, context);
    }

    protected VisitSingleNavigationExpression(node: Token, context: any) {
        if (node.value.current && node.value.next) {
            this.Visit(node.value.current, context);
            this.Visit(node.value.next, context);
        } else this.Visit(node.value, context);
    }

    protected VisitLesserThanExpression(node: Token, context: any) {
        this.Visit(node.value.left, context);
        this.where += " < ";
        this.Visit(node.value.right, context);
    }

    protected VisitLesserOrEqualsExpression(node: Token, context: any) {
        this.Visit(node.value.left, context);
        this.where += " <= ";
        this.Visit(node.value.right, context);
    }

    protected VisitGreaterThanExpression(node: Token, context: any) {
        this.Visit(node.value.left, context);
        this.where += " > ";
        this.Visit(node.value.right, context);
    }

    protected VisitGreaterOrEqualsExpression(node: Token, context: any) {
        this.Visit(node.value.left, context);
        this.where += " >= ";
        this.Visit(node.value.right, context);
    }

    public parameterObject(): { [key: number]: unknown } {
        return Object.assign({}, this.parameters);
    }

 

    protected VisitODataIdentifier(node: Token, context: any) {
        context.identifier = node.value.name;        
        
        if (this.entity != "" && context.target) 
            if (Object.keys(_DBDATAS[this.entity].columns).includes(node.value.name)) {
                
                if (context.relation) {                      
                    if (Object.keys(_DBDATAS[this.entity].relations).includes(context.relation)) {
                        if (!context.key) {
                            context.key = _DBDATAS[this.entity].relations[context.relation].entityColumn;
                            this[context.target] += `"${context.key}"`;
                        };
                        return
                    }
                }  
                
            } else if (Object.keys(_DBDATAS[this.entity].relations).includes(node.value.name)) {
                
                const relation = getEntityName(node.value.name);
                if (relation) {
                    context.relation = node.value.name;
                    context.table = _DBDATAS[relation].table;
                    if (!context.key) {
                        context.key = _DBDATAS[this.entity].relations[context.relation].entityColumn;
                        this[context.target] = `"${_DBDATAS[this.entity].relations[context.relation].entityColumn}"`;
                    };
                    return
                }      
            }
        if (!context.key) this[context.target] += `"${node.value.name}"`;
    }

    protected VisitEqualsExpression(node: Token, context: any): void {
        const testIsDate = oDatatoDate(node.value.right.raw);
        if (testIsDate) {            
            this.where += ` "${node.value.left.raw}" >= TO_DATE(${testIsDate}) - interval '1 day' AND "${node.value.left.raw}" <= TO_DATE(${testIsDate}) + interval '1 day'`;
        } else {
            this.Visit(node.value.left, context);
            this.where += " = ";
            this.Visit(node.value.right, context);
            if (context.literal == "NULL") {
                this.where = this.where.replace(/= NULL$/, "IS NULL").replace(new RegExp(`NULL = "${context.identifier}"$`), `"${context.identifier}" IS NULL`);
            }
        }
    }

    protected VisitNotEqualsExpression(node: Token, context: any): void {
        this.Visit(node.value.left, context);
        this.where += " <> ";
        this.Visit(node.value.right, context);
        this.where = this.where
            .replace(/<> NULL$/, "IS NOT NULL")
            .replace(new RegExp(`NULL <> "${context.identifier}"$`), `"${context.identifier}" IS NOT NULL`);
    }

    protected VisitLiteral(node: Token, context: any): void {
            if (context.relation && context.table && context.target == "where") {
             this.where += `(SELECT "${context.table}"."id" FROM "${context.table}" WHERE "${context.table}"."${context.identifier}" = ${SQLLiteral.convert(node.value, node.raw)})`;
            } else this.where += context.literal = (node.value == 'Edm.Boolean') ? node.raw : SQLLiteral.convert(node.value, node.raw);

    }

    protected VisitInExpression(node: Token, context: any): void {
        this.Visit(node.value.left, context);
        this.where += " IN (";
        this.Visit(node.value.right, context);
        this.where += ":list)";
    }

    protected VisitArrayOrObject(node: Token, context: any): void {
        this.where += context.literal = SQLLiteral.convert(node.value, node.raw);
    }

    
    protected createColumn(column: string): string {
        column = removeQuotes(column);
        let test:string | undefined = undefined;
        if (column.includes("/")) {
            const temp = column.split("/");
            if(_DBDATAS[this.entity].relations.hasOwnProperty(temp[0])) {
                const rel = _DBDATAS[this.entity].relations[temp[0]];
                column =  `(SELECT "${temp[1]}" FROM "${rel.tableName}" WHERE ${rel.expand} AND length("${temp[1]}"::text) > 2)`
                test = _DBDATAS[rel.entityName].columns[temp[1]].test;
                if (test) test = `(SELECT "${test}" FROM "${rel.tableName}" WHERE ${rel.expand})`;
            }
        } else if (!_DBDATAS[this.entity].columns.hasOwnProperty(column)) {
            if (_DBDATAS[this.entity].relations.hasOwnProperty(column)) {
                const rel = _DBDATAS[this.entity].relations[column];
                column =  `(SELECT "${rel.entityColumn}" FROM "${rel.tableName}" WHERE ${rel.expand} AND length("${rel.entityColumn}"::text) > 2)`
                test = _DBDATAS[rel.entityName].columns[rel.entityColumn].test;                
            } else throw new Error(`Invalid column ${column}`); 
        } else {
            test = `"${_DBDATAS[this.entity].columns[column].test}"`;
            column  = `"${column}"`;
        }
        if (test) column = `CASE 
        WHEN  ${test} = 'application/vnd.geo+json'
         THEN ST_GeomFromEWKT(ST_GeomFromGeoJSON(${column}))
         ELSE ST_GeomFromEWKT(${column}::text)
     END`;
        return column;
    }
    protected VisitMethodCallExpression(node: Token, context: any) {
        const method = node.value.method;
        const params = node.value.parameters || [];

        const columnOrData = (index: number): string => {
            const temp = decodeURI(Literal.convert(params[index].value, params[index].raw));
            return (_DBDATAS[this.entity].columns[temp]) ? `"${temp}"` :  `'${temp}'`;
        }

        const geoColumnOrData = (index: number, srid: boolean): string => {
            const temp = decodeURI(Literal.convert(params[index].value, params[index].raw)).replace("geography", "");
            return (_DBDATAS[this.entity].columns[temp]) ? temp :  `${srid === true ? 'SRID=4326;' : '' }${removeQuotes(temp)}`;
        }

        const cleanData = (index: number): string => params[index].value == 'Edm.String' ? removeQuotes(Literal.convert(params[index].value, params[index].raw)) : Literal.convert(params[index].value, params[index].raw);

        switch (method) {
            case "contains":
                this.Visit(params[0], context);
                this.where += ` ~* '${SQLLiteral.convert(params[1].value, params[1].raw).slice(1, -1)}'`;
                break;
            case "containsAny":
                this.where += "array_to_string(";
                this.Visit(params[0], context);
                this.where += ", ' ')";
                this.where += ` ~* '${SQLLiteral.convert(params[1].value, params[1].raw).slice(1, -1)}'`;
                break;
            case "endswith":
                this.where += `${columnOrData(0)}  ILIKE '%${cleanData(1)}'`;
                break;
            case "startswith":
                this.where += `${columnOrData(0)} ILIKE '${cleanData(1)}%'`;
                break;
            case "substring": 
                // if (params[0].value == "Edm.String" || params[0].type == "FirstMemberExpression") {
                if (params.length == 3)
                    this.where += ` SUBSTR(${columnOrData(0)}, ${cleanData(1)} + 1, ${cleanData(2)})`;
                    else this.where += ` SUBSTR(${columnOrData(0)}, ${cleanData(1)} + 1)`;
                break;               
            case "substringof":        
                this.where += `${columnOrData(0)} ILIKE '%${cleanData(1)}%'`;
                break;
            case "indexof":          
                // if (params[0].value == "Edm.String" || params[0].type == "FirstMemberExpression") {
                this.where += ` POSITION('${cleanData(1)}' IN ${columnOrData(0)})`;
                break;
            case "concat":
                this.where += `(${columnOrData(0)} || '${cleanData(1)}')`;
                break;
            case "length":
                this.where += `CHAR_LENGTH(${columnOrData(0)})`;
                break;
            case "tolower":
                this.where += `LOWER(${columnOrData(0)})`;
                break;
            case "toupper":
                this.where += `UPPER(${columnOrData(0)})`;
                break;
            case "year":
            case "month":
            case "day":
            case "hour":
            case "minute":
            case "second":
                this.where += `EXTRACT(${method.toUpperCase()} FROM ${columnOrData(0)})`;                
                break;
            case "round":
            case "floor":
            case "ceiling":
                this.where += `${method.toUpperCase()} (${columnOrData(0)})`;            
                break;
            case "now":
                this.where += "NOW()";
                break;
            case "date":
                    this.where += `${method.toUpperCase()}(`;
                    this.Visit(params[0], context);
                    this.where += ")";               
                    break;                
            case "time":                
                this.where += `(${columnOrData(0)})::time`;               
                break;                
            case "geo.distance":
            case "geo.contains":
            case "geo.crosses":
            case "geo.disjoint":
            case "geo.equals":
            case "geo.overlaps":
            case "geo.relate":
            case "geo.touches":
            case "geo.within":
                this.where += `${method.toUpperCase().replace("GEO.","ST_")}(${this.createColumn(columnOrData(0))}, '${geoColumnOrData(1, true)}')`;
                // this.where += `ST_Distance(${this.createColumn(columnOrData(0))}, '${geoColumnOrData(1, true)}')`;
                break;
            case "geo.length":
                    this.where += `ST_Length(ST_MakeLine(ST_AsText(${this.createColumn(columnOrData(0))}), '${geoColumnOrData(1, false)}'))`;
                break;
            case "geo.intersects":
                this.where += `st_intersects(ST_AsText(${this.createColumn(columnOrData(0))}), '${geoColumnOrData(1, false)}')`;
                break;
            case "trim":
                this.where += `TRIM(BOTH '${(params.length == 2) ? cleanData(1) : " " }' FROM ${columnOrData(0)})`;
                break;
            case "mindatetime":
                this.where += `MIN(${this.where.split('" ')[0]}")`;                
                break;
        }
    }
}

