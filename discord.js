'use strict';
// Optional Discord bridge: panel message (status/players/buttons), console channel, cross-chat.
let client,iv,flush;
module.exports=async function(a){
 clearInterval(iv);clearInterval(flush);a.setHook(null);
 if(client){await client.destroy();client=null}
 const d=a.cfg.discord||{};if(!d.token)return;
 let D;try{D=require('discord.js')}catch{return a.emit('[panel] Discord needs: npm i discord.js')}
 const{Client,GatewayIntentBits:G,ActionRowBuilder:Row,ButtonBuilder:B,ButtonStyle:S,EmbedBuilder:E}=D;
 client=new Client({intents:[G.Guilds,G.GuildMessages,G.MessageContent]});
 const ch=id=>id&&client.channels.cache.get(id),isOp=m=>!!d.opRole&&m?.roles?.cache?.has(d.opRole);
 const view=()=>{const s=a.status(),p=a.players();return{embeds:[new E().setTitle(a.cfg.name||'Minecraft Server')
  .setColor(s==='online'?0x30d158:s==='offline'?0xff453a:0xffd60a)
  .addFields({name:'Status',value:s,inline:true},{name:'Players',value:`${p.length}/${a.cfg.maxPlayers}`+(p.length?'\n'+p.join(', '):''),inline:true})],
  components:[new Row().addComponents(new B().setCustomId('start').setLabel('Start').setStyle(S.Success),
   new B().setCustomId('stop').setLabel('Stop').setStyle(S.Danger),new B().setCustomId('restart').setLabel('Restart').setStyle(S.Secondary))]}};
 let pm,buf=[];
 client.once('clientReady',async()=>{const c=ch(d.panelChat);if(!c)return;
  const ms=await c.messages.fetch({limit:15}).catch(()=>null);
  pm=ms?.find(m=>m.author.id===client.user.id&&m.embeds.length)||await c.send(view()).catch(()=>null);
  iv=setInterval(()=>pm?.edit(view()).catch(()=>{}),15000)});
 client.on('interactionCreate',async i=>{if(!i.isButton())return;
  if(i.customId!=='start'&&!isOp(i.member))return i.reply({content:'You need the op role.',ephemeral:true});
  await i.reply({content:i.customId+'…',ephemeral:true});a[i.customId]()});
 client.on('messageCreate',m=>{if(m.author.bot)return;
  if(m.channelId===d.consoleChat&&isOp(m.member))a.cmd(m.content);
  else if(m.channelId===d.crossChat&&a.status()==='online')a.cmd('tellraw @a '+JSON.stringify({text:`[Discord] ${m.member?.displayName||m.author.username}: ${m.content}`}))});
 a.setHook(l=>{buf.push(l.replace(/```/g,"'''").slice(0,300));
  const c=l.match(/\]: <(\w+)> (.*)$/),j=l.match(/\]: (\w+) (joined|left) the game/);
  const x=ch(d.crossChat);if(x&&(c||j))x.send({content:c?`**${c[1]}**: ${c[2]}`:`*${j[1]} ${j[2]} the game*`,allowedMentions:{parse:[]}}).catch(()=>{})});
 flush=setInterval(()=>{const c=ch(d.consoleChat);if(!c||!buf.length)return;let t=buf.join('\n');buf=[];
  for(let i=0;i<t.length&&i<7600;i+=1900)c.send('```\n'+t.slice(i,i+1900)+'\n```').catch(()=>{})},2500);
 client.login(d.token).catch(e=>a.emit('[panel] Discord login failed: '+e.message));
};
