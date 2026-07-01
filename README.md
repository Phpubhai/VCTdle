# VCTdle 🎯

เกมทายผู้เล่นมืออาชีพ **VCT (Valorant Champions Tour) 2026** สไตล์ Wordle/Loldle — พิมพ์ชื่อผู้เล่นแล้วดูคำใบ้จากสีในแต่ละคอลัมน์จนกว่าจะเดาถูก

🎮 **เล่นเลย:** https://phpubhai.github.io/VCTdle/

![VCTdle](assets/regions/americas.png)

## วิธีเล่น

1. พิมพ์ชื่อผู้เล่น VCT (เช่น `aspas`, `Derke`, `f0rsakeN`) ในช่องค้นหา
2. แต่ละคอลัมน์จะแสดงสี:
   - 🟢 **เขียว** = ตรง
   - 🟡 **เหลือง** = ใกล้เคียง (สัญชาติ = ลีกเดียวกัน / อายุ = ห่าง 1 ปี)
   - 🔴 **แดง** = ไม่ตรง
   - ▲ / ▼ = คำตอบมีอายุมากกว่า / น้อยกว่า
3. เดาไปเรื่อยๆ จนถูก แล้วกด "เล่นอีกครั้ง" เพื่อสุ่มผู้เล่นใหม่

**คอลัมน์ที่ใช้เดา:** รูป · สัญชาติ · ภูมิภาค · อายุ · ทีม · ตำแหน่ง (Role) · IGL · แชมป์ International · แชมป์ Regional

**ตัวกรอง:** เลือกได้ว่าจะให้คำตอบสุ่มมาจากลีกไหนบ้าง (Americas / EMEA / Pacific / China)

## ข้อมูล

- ผู้เล่น 241 คน จาก 4 ลีกใหญ่ของ VCT 2026 (Americas, EMEA, Pacific, China)
- ข้อมูล (อายุ, ตำแหน่ง, IGL, ถ้วยรางวัล) verify จาก [Liquipedia](https://liquipedia.net/valorant/) และ [vlr.gg](https://www.vlr.gg/)
- รูปผู้เล่น/โลโก้ทีมจาก vlr.gg · ธงจาก flagcdn.com

## รันในเครื่อง

เกมเป็น static site ล้วน ไม่ต้อง build:

```bash
# เปิดตรงๆ ได้เลย — ดับเบิลคลิก index.html
# หรือรันผ่าน local server:
python -m http.server 5173
# แล้วเปิด http://localhost:5173
```

## แก้ไขข้อมูลผู้เล่น

แก้ที่ [`players.json`](players.json) (ต้นฉบับ) แล้วรัน sync:

```bash
node sync-data.mjs   # อัปเดต players-data.js ที่เกมใช้จริง (คงรูป local ไว้)
```

## โครงสร้างไฟล์

```
index.html         โครงหน้า
style.css          ธีม Valorant
game.js            ลอจิกเกม + feedback engine
players.json       ฐานข้อมูลผู้เล่น (ต้นฉบับ, แก้ที่นี่)
players-data.js    ข้อมูลที่เกมโหลด (สร้างจาก players.json)
assets/            รูปผู้เล่น, โลโก้ทีม, โลโก้ภูมิภาค (local)
sync-data.mjs      สคริปต์ sync players.json -> players-data.js
```

---

*จัดทำเพื่อความบันเทิง ไม่มีส่วนเกี่ยวข้องกับ Riot Games*
