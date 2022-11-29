import koa from "koa";
import { _CONFIGFILE } from "../../configuration";
import { _DBDATAS } from "../../db/constants";
import { IUser } from "../../db/interfaces";
import { showConfigCtx } from "../../helpers";
import { IKeyString } from "../../types";
import { userHeader } from "../constant";
import { cssFile } from "../css";
// import { fileQueryCss, fileUserCss } from "./css";




export class CreateHtmlView {
    private ctx: koa.Context;

    constructor(ctx: koa.Context) {
        this.ctx = ctx;
        showConfigCtx(ctx);
    }

    private css = (name: string): string => {
        switch (name.toLowerCase()) {
            case "user":
                return cssFile("user.css");
            default:
                return                 cssFile("query.css");

        }
    };

    private head = (title: string, name: string): string => {
        return `<head> <meta charset="utf-8"> <style>${this.css(name)}</style> <title>${title}</title> </head>`;
    };

    private foot = (
        links: {
            href: string;
            class: string;
            name: string;
        }[]
    ): string => {
        const returnValue: string[] = ['<div class="hr"></div>'];
        links.forEach((element: { href: string; class: string; name: string }) => {
            returnValue.push(`<div class="inner"> <a href="${element.href}" class="${element.class}" >${element.name}</a> </div>`);
        });
        return returnValue.join();
    };

    public login = (datas: { login: boolean; body?: any; why?: IKeyString }): string => {
        const alert = (name: string): string => {
            return datas.why && datas.why[name] ? `<div class="alert">${datas.why[name]}</div>` : "";
        };
        return `<!DOCTYPE html>
                  <html>
                  ${this.head("Login", "user")}    
                  <body>
                      <div class="login-wrap">
                        <div class="login-html">
                          <input id="tab-1" type="radio" name="tab" class="sign-in" ${
                              datas.login ? "checked" : ""
                          }><label for="tab-1" class="tab">Sign In</label>
                          <input id="tab-2" type="radio" name="tab" class="sign-up" ${
                              datas.login ? "" : "checked"
                          }><label for="tab-2" class="tab">Sign Up</label>
                          <div class="login-form">
                            <form action="${this.ctx._linkBase}/${this.ctx._version}/login" method="post">
                              <div class="sign-in-htm">
                                <div class="group">
                                  <label for="user" class="label">Username</label>
                                  <input id="user" name="username" type="text" class="input">
                                </div>
                                <div class="group">
                                  <label for="pass" class="label">Password</label>
                                  <input id="pass" name="password" type="password" class="input" data-type="password">
                                </div>
                                <div class="group">
                                  <input id="check" type="checkbox" class="check" checked>
                                  <label for="check"><span class="icon"></span> Keep me Signed in</label>
                                </div>
                                <div class="group">
                                  <input type="submit" class="button" value="Sign In">
                                </div>
                                <div class="hr"></div>
                                <div class="group">
                                  <a href="${this.ctx._linkBase}/${this.ctx._version}/Query" class="button" >Return to Query</a> 
                                </div>
                                
                                <div class="foot-lnk">
                                  <a href="#forgot">Forgot Password?</a>
                                </div>
                              </div>
                            </form>
                  
                            <form action="/register" method="post">
                              <div class="sign-up-htm">
                                <div class="group">
                                  <label for="user" class="label">Username</label>
                                  <div class='tooltip help'>
                                    <span>?</span>
                                    <div class='content'>
                                      <b></b>
                                      <p>Name must be at least 2 words</p>
                                    </div>
                                  </div>
                                  <input id="regusername" type="text" name="username" class="input" value="${
                                      datas.body && datas.body.username ? datas.body.username : ""
                                  }">
                                  ${alert("username")}
                                </div>
                                <div class="group">
                                  <label for="pass" class="label">Password</label>
                                  <div class='tooltip help'>
                                    <span>?</span>
                                    <div class='content'>
                                      <b></b>
                                      <p>At least one number, one lowercase and one uppercase letter, at least six characters that are letters, numbers or the
                                      underscore</p>
                                    </div>
                                  </div>
                                  <input id="regpass" type="password" name="password" class="input" data-type="password" value="${
                                      datas.body && datas.body.password ? datas.body.password : ""
                                  }">
                                  ${alert("password")}
                                </div>
                                <div class="group">
                                  <label for="pass" class="label">Repeat Password</label>
                                  <div class='tooltip help'>
                                    <span>?</span>
                                    <div class='content'>
                                      <b></b>
                                      <p>Same as password</p>
                                    </div>
                                  </div>
                                  <input id="regrepeat" type="password" name="repeat" class="input" data-type="password" value="${
                                      datas.body && datas.body.repeat ? datas.body.repeat : ""
                                  }">
                                  ${alert("repeat")}
                                </div>
                                <div class="group">
                                  <label for="pass" class="label">Email Address</label>
                                  <div class='tooltip help'>
                                    <span>?</span>
                                    <div class='content'>
                                      <b></b>
                                      <p>A valid email address</p>
                                    </div>
                                  </div>
                                  <input id="regmail" type="text" name="email" class="input" value="${datas.body && datas.body.email ? datas.body.email : ""}">
                                  ${alert("email")}
                                </div>
                  
                                <div class="group">
                                  <input type="submit" class="button" value="Sign Up">
                                </div>
                                <div class="hr"></div>
                                
                                <div class="foot-lnk">
                                  <label for="tab-1">Already Member?</a>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>


                  </body>                  
                </html>`;
    };

    private CheckedUsers = (user: any): string[] => {
        const temp: string[] = [];

        Object.keys(user).forEach((element: string) => {
            if (Object.keys(userHeader).includes(element)) {
                temp.push('<div class="group">');
                temp.push(`<input type="checkbox" id="${element}" name="${element}"${user[element] == true ? "checked" : ""}>`);
                temp.push(`<label for="canPost">${userHeader[element]}</label>`);
                temp.push("</div>");
            }
        });
        return temp;
    };

    public edit = (datas: { body?: any; why?: IKeyString }): string => {
        const user = datas.body;
        const alert = (name: string): string => (datas.why && datas.why[name] ? `<div class="alert">${datas.why[name]}</div>` : "");
        return `<!DOCTYPE html>
                  <html>
                  ${this.head("Edit", "user")}    
                  <body>
                      <div class="login-wrap">
                        <div class="login-html">
                          <div class="login-form">
                            <form action="/user" method="post">
                                  <input id="id" name="id" type="hidden" class="input"value="${user.id}">

                                <div class="group">
                                  <label for="user" class="label">Username</label>
                                  <input id="user" name="username" type="text" class="input"value="${user.username ? user.username : ""}">
                                </div>
                                <div class="group">
                                  <label for="pass" class="label">Email Address</label>
                                  <div class='tooltip help'>
                                    <span>?</span>
                                    <div class='content'>
                                      <b></b>
                                      <p>A valid email address</p>
                                    </div>
                                  </div>
                                  <input id="regmail" type="text" name="email" class="input" value="${user.email ? user.email : ""}">
                                  ${alert("email")}
                                </div>

                                <div class="group">
                                  <label for="database" class="label">Database</label>
                                  <input id="database" name="database" type="text" class="input"value="${user.database ? user.database : ""}">
                                </div>

                                ${this.CheckedUsers(user).join("")}
                                <div class="group">
                                  <input type="submit" class="button" value="Update infos">
                                </div>
                                <div class="hr"></div>
                                <div class="foot-lnk">
                                  <a href="#forgot">Recreate Password?</a>
                                </div>
                            </form>
                          </div>
                        </div>
                      </div>
                  </body>
              </html>`;
    };

    public status = (user: IUser): string => {
        return `<!DOCTYPE html> <html> ${this.head(
            "Status",
            "user"
        )} <body> <div class="login-wrap"> <div class="login-html"> <h2>You are authenticated.</h2> <div class="hr"></div> <h3>Username : ${
            user.username
        }</h3> <h3>Hosting : ${user.database == "all" ? "all" : _CONFIGFILE[user.database].pg_host}</h3> <h3>Database : ${user.database}</h3> <h3>Status : ${
            user.admin
        }</h3> ${user.superAdmin ? `<div class="inner"> <a href="${this.ctx._linkBase}/admin" class="button-admin" >users</a> </div>` : ""} ${this.foot([
            { href: this.ctx._linkBase + "/Logout", class: "button-logout", name: "Logout" },
            { href: this.ctx._linkBase + `/${this.ctx._version}/Query`, class: "button", name: "Query" }
        ])} </div> </div> </body> </html> `;
    };

    public error = (message: string): string => {
        return `<!DOCTYPE html> <html> ${this.head(
            "Error",
            "user"
        )} <body> <div class="login-wrap"> <div class="login-html"> <h1>Error.</h1> <div class="hr"></div> <h3>On error page</h3> <h3>${message}</h3> <div class="hr"></div> <div id="outer"> <div class="inner"> <a href="/Login" class="button-submit" >Login</a> </div> <div class="inner"> <a href="${
            this.ctx._linkBase + `/${this.ctx._version}/Query`
        }" class="button" >query</a> </div> </div> </div> </body> </html>`;
    };

    public infos = async (): Promise<string> => {
        // const temp = statsDatabase(this.ctx._configName);
        // const res = await db[this.ctx._configName].raw(temp.tables).then((res) => res.rows[0]);
        // const admin = await db["admin"].raw(temp.admin).then((res) => res.rows[0]);

        // const fillTable = (): string => {
        //     const returnValue: string[] = [`<tr><td>${this.ctx._linkBase}</td><td>${this.ctx._configName}</td></tr>`];
        //     Object.keys(res).forEach((element: string) => returnValue.push(`<tr><td>Table ${element}</td><td>${res[element]}</td></tr>`));
        //     Object.keys(admin).forEach((element: string) => returnValue.push(`<tr><td>${element}</td><td>${admin[element]}</td></tr>`));
        //     return returnValue.join("");
        // };
        return `<!DOCTYPE html> <html> ${this.head(
            "Infos",
            "user"
        )} <body> <div class="login-html"> <div class="table-wrapper"> <table class="fl-table"> <tbody>TODO</tbody></table> </div> ${this.foot([
            { href: this.ctx._linkBase + `/${this.ctx._version}/`, class: "button-submit", name: "Root" },
            { href: this.ctx._linkBase + `/${this.ctx._version}/Query`, class: "button", name: "Query" },
            { href: `${_CONFIGFILE[this.ctx._configName].webSiteDoc}`, class: "button-logout", name: "Documentation" }
        ])} </div> </body> </html> `;
    };

    public admin = (user: IUser, Host: string, version: string): string => {
        return `<!DOCTYPE html> <html> <head> <title>Admin</title> <style> var crudApp=new function(){this.users={},this.userHeader=${userHeader},this.category=["Business","Computers","Programming","Science"],this.col=[],this.loadDatas=async function(){document.ctx.includes("/Admin")?document.ctx.split("/Admin")[0]:document.ctx.includes("/admin")&&document.ctx.split("/admin")[0];let t=await fetch("/all",{method:"GET",headers:{"Content-Type":"application/json"}});try{var e=await t.text();this.users=JSON.parse(e)}catch(t){console.log("Error",t.message)}},this.createTable=async function(){await this.loadDatas(),this.col=Object.keys(this.users[0]).filter(t=>"id"!=t.toLowerCase());var t=document.createElement("table");t.setAttribute("class","fl-table"),t.setAttribute("id","usersTable");for(var e=t.insertRow(-1),i=0;i<this.col.length;i++){var s=document.createElement("th");const t=this.userHeader[this.col[i]]?this.userHeader[this.col[i]]:this.col[i];s.innerHTML=t,e.appendChild(s)}this.td=document.createElement("td"),e.appendChild(this.td);var n=document.createElement("input");n.setAttribute("type","button"),n.setAttribute("value","Add"),n.setAttribute("id","New"+r),n.setAttribute("class","btn_submit _submit"),n.setAttribute("onclick","crudApp.CreateNew()"),this.td.appendChild(n);for(var r=0;r<this.users.length;r++){e=t.insertRow(-1);for(var a=0;a<this.col.length;a++){var d=e.insertCell(-1);const t=this.users[r][this.col[a]];d.innerHTML="true"==t.toString()?"✔":"false"==t.toString()?"✖":t.toString()}this.td=document.createElement("td"),e.appendChild(this.td);var c=document.createElement("input");c.setAttribute("type","button"),c.setAttribute("value","Edit"),c.setAttribute("id","Edit"+r),c.setAttribute("class","btn_go _go"),c.setAttribute("onclick",`;
    };

  }
