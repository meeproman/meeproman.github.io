    // Array สำหรับเก็บข้อมูลของsession ต่างๆไว้แสดงผล
    var studySessions = [];

    function addStudySession() {
        //เก็บข้อมูลจากinputต่างๆ
      var subjectInput = document.getElementById("subject");
      var durationInput = document.getElementById("duration");
      var timeInput = document.getElementById("time");
        //เปลี่ยนข้อมูลให้เป็นชนิดต่างๆ
      var subject = subjectInput.value;
      var duration = parseInt(durationInput.value);
      var time = new Date(timeInput.value);

      // เช็คว่าใส่ชื่อวิชามาหรือไม่ ใส่เวลามาเป็นตัวเลขหรือเปล่า
      if (subject === "" || isNaN(duration) || isNaN(time.getTime())) {
        alert("Please fill in all the fields correctly.");
        //ถ้าไม่ให้เตือนให้ใส่ใหม่
        return;
      }

      // เพิ่มข้อมูล session ที่รับมาเข้าไปใน array
      studySessions.push({
        subject: subject,
        duration: duration,
        time: time
      });

      // เมื่อเพิ่มเรียบร้อยแล้วก็ลบข้อมูลในช่องที่กรอกออกเพื่อรอข้อมูลใหม่ 
      subjectInput.value = "";
      durationInput.value = "";
      timeInput.value = "";

      // ขึ้นเตือนให้เห็นว่าเพิ่มข้อมูลสำเร็จแล้ว
      alert("Study session added successfully!");

     
      // เรียกใช้ฟังชั่นเพื่ออัพเดทข้อมูลที่กรอก
      updateSessionList();

      // กำหนดให้เรียกฟังชั่นอัพเดททุกวินาที เพื่อที่จะแสดงเวลาที่เหลือทุกๆ 1 วิ
      setInterval(updateSessionList, 1000);
    }

    //ลบobject ตำแหน่งใน array ตาม index ของ object
    function deleteStudySession(index) {
      studySessions.splice(index, 1);
      updateSessionList();
    }

    function updateSessionList() {
      var sessionList = document.getElementById("sessionList");
      sessionList.innerHTML = "";
      //รับ unorder list มา แล้วลบข้อมูลเดิมออก

      // loop ตามข้อมูลใน arrayด้วย foreach โดยฟังชั่นจะทำงานเมื่อเจอแต่ละข้อมูลในarray
      studySessions.forEach(function(studySession, index) {
        var listItem = document.createElement("li");
        // สำหรับทุก session ใน array ให้เพิ่ม <li>  หลังจากนั้นกำหนดให้list item มี textContent ที่ประกอบด้วยชื่อวิชา ตามด้วยเวลาที่แปลงให้เป็น string 
        listItem.textContent = studySession.subject + " - " + studySession.time.toLocaleString();
            //ตัวแปรสำหรับเวลาที่เหลืออยู่กรณีที่อยู่ระหว่าง session นั้น  โดยเอาเวลาที่รับมา - เวลาปัจจุบัน
        var timeRemaining = studySession.time.getTime() - Date.now();

        //ถ้าเวลาเหลื่อมากกว่า 0 ให้แสดงผลเวลาที่เหลือ
        if (timeRemaining > 0) {
          var minutesRemaining = Math.floor(timeRemaining / 60000);
          var secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);
          listItem.textContent += " (กำลังจะเริ่มใน " + minutesRemaining + " นาที " + secondsRemaining + " วินาที)";
            //ถ้าเวลาเหลือมากกว่า 0 ให้ขึ้นว่า in progess
        } else if (timeRemaining >= -studySession.duration * 60000) {
          listItem.textContent += " (ดำเนินอยู่ในขณะนี้)";
            //และแสดงเวลาที่เหลือในsession นั้นถ้าหากเวลาที่เหลืออยู่น้อยกว่าหรือเท่ากับ 0 และมากกว่าหรือเท่ากับค่าลบของระยะเวลาของ session นั้น
          var sessionTimeRemaining = Math.ceil((-timeRemaining - (studySession.duration * 60000)) / 1000);
          let minutes = Math.floor(sessionTimeRemaining /60);
          listItem.textContent += " - สิ้นสุดใน" + minutes + "นาที";
        } else {
          listItem.textContent += " (เสร็จสิ้น)";
        }

        // สร้างปุ่มdelete พร้อมกัน event onclick ที่เรียกใช้ฟังชั่น deleteStudySession โดยมีargument เป็น index ของ session นั้นๆ
        var deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.id = "delete";
        deleteButton.onclick = (function (i) {
          return function () {
            deleteStudySession(i);
          };
        })(index);

        listItem.appendChild(deleteButton);
        sessionList.appendChild(listItem);
      });
    }

    //ขอบคุณborntodev สำหรับความรู้ดีๆครับ