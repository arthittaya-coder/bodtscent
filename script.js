/* ==========================================================================
   Body Scent — script.js
   ไฟล์เดียวใช้ร่วมทุกหน้า ตรวจจาก element ที่มีในหน้านั้นๆ ว่าต้องรันฟังก์ชันไหน
   - product.html : #product-list, #filter-bar
   - order.html   : #orderForm, #items, #total
   - admin.html   : #ordersTable
   ========================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "bodyScentOrders";
  var MOODS = ["fresh", "sweet", "confident", "romance"];
  var MOOD_LABELS = {
    all: "ทั้งหมด",
    fresh: "Fresh",
    sweet: "Sweet",
    confident: "Confident",
    romance: "Romance"
  };
  var TYPE_LABELS = { spray: "สเปรย์", rollon: "โรลออน" };

  /* ------------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------------ */
  function formatPrice(value) {
    var n = Number(value);
    if (isNaN(n)) return "0 บาท";
    return n.toLocaleString("th-TH") + " บาท";
  }

  function setFieldValue(el, value) {
    if (!el) return;
    if ("value" in el) {
      el.value = value;
    } else {
      el.textContent = value;
    }
  }

  function getFieldValue(el) {
    if (!el) return "";
    return ("value" in el ? el.value : el.textContent) || "";
  }

  function readOrders() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("อ่านข้อมูลคำสั่งซื้อไม่สำเร็จ", err);
      return [];
    }
  }

  /* ------------------------------------------------------------------------
     product.html — โหลดสินค้า, การ์ด, ตัวกรอง mood
     ------------------------------------------------------------------------ */
  function initProductPage() {
    var listEl = document.getElementById("product-list");
    if (!listEl) return;

    var filterEl = document.getElementById("filter-bar");
    var products = [];
    var currentMood = "all";

    function createCard(p) {
      var card = document.createElement("article");
      card.className = "product-card";
      card.setAttribute("data-mood", p.mood);

      var thumb = document.createElement("div");
      thumb.className = "thumb";
      var img = document.createElement("img");
      img.src = p.image;
      img.alt = p.name;
      img.loading = "lazy";
      thumb.appendChild(img);

      var body = document.createElement("div");
      body.className = "body";

      var meta = document.createElement("div");
      meta.className = "meta";
      var dot = document.createElement("span");
      dot.className = "mood-dot";
      dot.setAttribute("aria-hidden", "true");
      var moodText = document.createElement("span");
      moodText.textContent = MOOD_LABELS[p.mood] || p.mood;
      var badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = (TYPE_LABELS[p.type] || p.type) + " " + p.size;
      meta.appendChild(dot);
      meta.appendChild(moodText);
      meta.appendChild(badge);

      var title = document.createElement("h3");
      title.textContent = p.name;

      var desc = document.createElement("p");
      desc.textContent = p.description;

      var footer = document.createElement("div");
      footer.className = "footer";
      var price = document.createElement("span");
      price.className = "price";
      price.textContent = formatPrice(p.price);

      var params = new URLSearchParams();
      params.set("item", p.name + " (" + p.size + ")");
      params.set("price", p.price);
      var btn = document.createElement("a");
      btn.className = "btn btn-accent btn-small";
      btn.href = "order.html?" + params.toString();
      btn.textContent = "สั่งซื้อ";

      footer.appendChild(price);
      footer.appendChild(btn);

      body.appendChild(meta);
      body.appendChild(title);
      body.appendChild(desc);
      body.appendChild(footer);

      card.appendChild(thumb);
      card.appendChild(body);
      return card;
    }

    function render() {
      listEl.innerHTML = "";
      var visible = products.filter(function (p) {
        return currentMood === "all" || p.mood === currentMood;
      });

      if (visible.length === 0) {
        var empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "ไม่พบสินค้าในหมวดนี้";
        listEl.appendChild(empty);
        return;
      }

      var frag = document.createDocumentFragment();
      visible.forEach(function (p) {
        frag.appendChild(createCard(p));
      });
      listEl.appendChild(frag);
    }

    function updateFilterButtons() {
      if (!filterEl) return;
      var buttons = filterEl.querySelectorAll("[data-mood]");
      Array.prototype.forEach.call(buttons, function (b) {
        var active = b.getAttribute("data-mood") === currentMood;
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function setMood(mood) {
      currentMood = MOODS.indexOf(mood) !== -1 ? mood : "all";
      updateFilterButtons();
      render();
    }

    function buildFilterBar() {
      if (!filterEl) return;
      // ถ้า HTML มีปุ่มพร้อมแล้ว (มี data-mood) ใช้ของเดิม ไม่สร้างซ้ำ
      if (!filterEl.querySelector("[data-mood]")) {
        ["all"].concat(MOODS).forEach(function (m) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "filter-btn";
          b.setAttribute("data-mood", m);
          b.textContent = MOOD_LABELS[m];
          filterEl.appendChild(b);
        });
      }
      filterEl.addEventListener("click", function (e) {
        var target = e.target.closest("[data-mood]");
        if (!target || !filterEl.contains(target)) return;
        var mood = target.getAttribute("data-mood");
        setMood(mood);
        // อัปเดต URL โดยไม่โหลดหน้าใหม่ เพื่อให้แชร์ลิงก์ที่กรองแล้วได้
        try {
          var url = new URL(window.location.href);
          if (mood === "all") {
            url.searchParams.delete("mood");
          } else {
            url.searchParams.set("mood", mood);
          }
          window.history.replaceState(null, "", url.toString());
        } catch (err) {
          /* ไม่กระทบการทำงานหลัก */
        }
      });
    }

    buildFilterBar();

    // อ่าน ?mood=xxx ตอนโหลด
    var initialMood = new URLSearchParams(window.location.search).get("mood");
    currentMood = MOODS.indexOf(initialMood) !== -1 ? initialMood : "all";
    updateFilterButtons();

    fetch("products.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        products = Array.isArray(data) ? data : [];
        render();
      })
      .catch(function (err) {
        console.error("โหลด products.json ไม่สำเร็จ", err);
        listEl.innerHTML = "";
        var msg = document.createElement("p");
        msg.className = "empty-state";
        msg.textContent =
          "ไม่สามารถโหลดรายการสินค้าได้ กรุณาลองใหม่อีกครั้ง";
        listEl.appendChild(msg);
      });
  }

  /* ------------------------------------------------------------------------
     order.html — เติม item/price จาก URL, บันทึกคำสั่งซื้อ
     ------------------------------------------------------------------------ */
  function initOrderPage() {
    var form = document.getElementById("orderForm");
    if (!form) return;

    var itemsEl = document.getElementById("items");
    var totalEl = document.getElementById("total");

    var params = new URLSearchParams(window.location.search);
    var item = params.get("item") || "";
    var priceNum = Number(params.get("price"));
    if (isNaN(priceNum) || priceNum < 0) priceNum = 0;

    // เติมทั้งสองช่องเสมอ
    setFieldValue(itemsEl, item);
    var isInput = totalEl && "value" in totalEl;
    setFieldValue(totalEl, isInput ? String(priceNum) : formatPrice(priceNum));

    function fieldValue(name) {
      var el = form.elements[name];
      return el && typeof el.value === "string" ? el.value.trim() : "";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (typeof form.reportValidity === "function" && !form.reportValidity()) {
        return;
      }

      var totalRaw = getFieldValue(totalEl).replace(/[^\d.]/g, "");
      var total = totalRaw === "" ? priceNum : Number(totalRaw);

      var payload = {
        customerName: fieldValue("customerName"),
        contact: fieldValue("contact"),
        items: getFieldValue(itemsEl).trim(),
        total: total,
        note: fieldValue("note"),
        timestamp: new Date().toISOString()
      };

      try {
        var orders = readOrders();
        orders.push(payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      } catch (err) {
        console.error("บันทึกคำสั่งซื้อไม่สำเร็จ", err);
        window.alert("ไม่สามารถบันทึกคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      window.location.href = "thankyou.html";
    });
  }

  /* ------------------------------------------------------------------------
     admin.html — แสดงรายการคำสั่งซื้อ
     ------------------------------------------------------------------------ */
  function initAdminPage() {
    var table = document.getElementById("ordersTable");
    if (!table) return;

    var tbody = table.querySelector("tbody");
    if (!tbody) {
      tbody = document.createElement("tbody");
      table.appendChild(tbody);
    }
    tbody.innerHTML = "";

    var orders = readOrders().slice().sort(function (a, b) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    var columnCount = table.querySelectorAll("thead th").length || 6;

    if (orders.length === 0) {
      var emptyRow = document.createElement("tr");
      var emptyCell = document.createElement("td");
      emptyCell.colSpan = columnCount;
      emptyCell.className = "empty-state";
      emptyCell.textContent = "ยังไม่มีคำสั่งซื้อ";
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return;
    }

    orders.forEach(function (o) {
      var date = new Date(o.timestamp);
      var dateText = isNaN(date.getTime()) ? "-" : date.toLocaleString("th-TH");
      var cells = [
        dateText,
        o.customerName || "-",
        o.contact || "-",
        o.items || "-",
        formatPrice(o.total),
        o.note || "-"
      ];

      var tr = document.createElement("tr");
      cells.forEach(function (text) {
        var td = document.createElement("td");
        td.textContent = text; // textContent กัน HTML injection จากข้อมูลลูกค้า
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  /* ------------------------------------------------------------------------
     Init
     ------------------------------------------------------------------------ */
  function init() {
    initProductPage();
    initOrderPage();
    initAdminPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
