/* JavaScript thuần. Không gọi API, không cần máy chủ hoặc thư viện ngoài. */
(function () {
  'use strict';

  function normalizePlate(value) {
    return String(value == null ? '' : value).normalize('NFKC').toUpperCase()
      .replace(/[\s.\-\u2010-\u2015]/g, '');
  }

  function vehicleGroup(vehicle) {
    if (vehicle.startsWith('Ô tô')) return 'car';
    if (vehicle.startsWith('Mô tô') || vehicle.startsWith('Xe máy')) return 'motorbike';
    return 'other';
  }

  function validatePlate(value) {
    const normalized = normalizePlate(value);
    if (!normalized) return 'Vui lòng nhập biển số xe cần tra cứu.';
    if (!/^[A-ZĐ0-9]{5,12}$/.test(normalized) || !/[A-ZĐ]/.test(normalized) || !/[0-9]/.test(normalized)) {
      return 'Biển số cần có chữ và số, dài 5–12 ký tự sau khi bỏ dấu. Ví dụ: 68C-162.58.';
    }
    return '';
  }

  function searchRecords(records, plate, vehicle) {
    const key = normalizePlate(plate);
    if (!key) return [];
    return records.filter(function (record) {
      if (normalizePlate(record.plate) !== key) return false;
      if (!vehicle) return true;
      if (vehicle.startsWith('group:')) return vehicleGroup(record.vehicle) === vehicle.slice(6);
      return record.vehicle === vehicle;
    }).sort(function (a, b) {
      return (b.date + b.time).localeCompare(a.date + a.time) || a.id - b.id;
    });
  }

  function formatDate(value) {
    const parts = String(value).split('-');
    return parts.length === 3 ? parts[2] + '/' + parts[1] + '/' + parts[0] : String(value);
  }

  // Các hàm này cũng có thể tái sử dụng khi tích hợp vào trang web khác.
  window.FineLookup = Object.freeze({ normalizePlate, vehicleGroup, validatePlate, searchRecords, formatDate });

  const $ = function (id) { return document.getElementById(id); };
  const form = $('search-form');
  const input = $('plate');
  const select = $('vehicle');
  const list = $('result-list');
  const empty = $('empty-state');
  const error = $('plate-error');
  const count = $('result-count');
  const status = $('search-status');
  const example = $('example-button');
  const dataset = window.FINE_DATA;
  let hasSearched = false;

  if (!dataset || !Array.isArray(dataset.records) || !dataset.meta) {
    $('data-error').textContent = 'Không tải được dữ liệu. Hãy giải nén toàn bộ file ZIP và giữ data.js cùng thư mục với index.html, sau đó mở lại trang.';
    $('data-error').hidden = false;
    $('data-period').textContent = 'Dữ liệu chưa sẵn sàng';
    $('empty-title').textContent = 'Chưa thể tra cứu';
    $('empty-description').textContent = 'Vui lòng kiểm tra lại file dữ liệu theo thông báo phía trên.';
    $('search-button').disabled = true;
    example.hidden = true;
    form.addEventListener('submit', function (event) { event.preventDefault(); });
    return;
  }

  const records = dataset.records;
  const meta = dataset.meta;
  $('data-period').textContent = 'Từ ' + formatDate(meta.dateFrom) + ' đến ' + formatDate(meta.dateTo);
  $('data-total').textContent = records.length.toLocaleString('vi-VN') + ' bản ghi trong dữ liệu cung cấp';

  const types = Array.from(new Set(records.map(function (record) { return record.vehicle; })));
  const groups = [
    { key: 'car', label: 'Ô tô', all: 'Ô tô (tất cả loại)' },
    { key: 'motorbike', label: 'Mô tô, xe máy', all: 'Mô tô, xe máy (tất cả loại)' },
    { key: 'other', label: 'Phương tiện khác', all: 'Phương tiện khác (tất cả loại)' }
  ];
  groups.forEach(function (group) {
    const items = types.filter(function (type) { return vehicleGroup(type) === group.key; }).sort(function (a, b) { return a.localeCompare(b, 'vi'); });
    if (!items.length) return;
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.label;
    if (items.length > 1) {
      const option = document.createElement('option');
      option.value = 'group:' + group.key;
      option.textContent = group.all;
      optgroup.appendChild(option);
    }
    items.forEach(function (type) {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  });

  function clearError() {
    error.hidden = true;
    error.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function showEmpty(title, description, showExample) {
    list.replaceChildren();
    list.hidden = true;
    empty.hidden = false;
    $('empty-title').textContent = title;
    $('empty-description').textContent = description;
    example.hidden = !showExample;
    count.hidden = true;
    count.textContent = '';
  }

  function renderResult(result, query) {
    if (!result.length) {
      const typeLabel = select.value ? ' với loại phương tiện đã chọn' : '';
      const message = 'Không có bản ghi khớp biển số ' + normalizePlate(query) + typeLabel + ' trong danh sách cung cấp. Kiểm tra biển số hoặc chọn Tất cả phương tiện.';
      showEmpty('Không tìm thấy trong danh sách', message, false);
      status.textContent = message;
      return;
    }
    empty.hidden = true;
    list.replaceChildren();
    const fragment = document.createDocumentFragment();
    result.forEach(function (record, index) {
      const card = $('violation-template').content.cloneNode(true);
      card.querySelector('.plate-value').textContent = record.plate;
      card.querySelector('.record-number').textContent = 'Bản ghi ' + (index + 1) + '/' + result.length;
      card.querySelector('.date-value').textContent = formatDate(record.date);
      card.querySelector('.time-value').textContent = record.time.endsWith(':00') ? record.time.slice(0, 5) : record.time;
      card.querySelector('.vehicle-value').textContent = record.vehicle;
      card.querySelector('.violation-value').textContent = record.violation;
      card.querySelector('.record-source').textContent = 'STT trong dữ liệu gốc: ' + record.id;
      fragment.appendChild(card);
    });
    list.appendChild(fragment);
    list.hidden = false;
    count.textContent = result.length + ' bản ghi';
    count.hidden = false;
    status.textContent = 'Tìm thấy ' + result.length + ' bản ghi cho biển số ' + normalizePlate(query) + '. Kết quả sắp xếp theo thời gian mới nhất.';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearError();
    const message = validatePlate(input.value);
    if (message) {
      showEmpty('Kiểm tra thông tin tra cứu', 'Nhập biển số hợp lệ để xem thông tin vi phạm.', false);
      error.textContent = message;
      error.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      status.textContent = message;
      hasSearched = false;
      return;
    }
    renderResult(searchRecords(records, input.value, select.value), input.value);
    hasSearched = true;
  });

  function markChanged() {
    clearError();
    if (!hasSearched) return;
    showEmpty('Thông tin tra cứu đã thay đổi', 'Bấm Tra cứu để xem kết quả theo thông tin mới.', false);
    status.textContent = 'Thông tin đã thay đổi. Bấm Tra cứu để cập nhật kết quả.';
    hasSearched = false;
  }
  input.addEventListener('input', markChanged);
  select.addEventListener('change', markChanged);
  form.addEventListener('reset', function () {
    clearError();
    showEmpty('Sẵn sàng tra cứu', 'Thông tin vi phạm sẽ hiển thị tại đây sau khi bạn nhập biển số.', true);
    hasSearched = false;
    status.textContent = 'Đã xóa thông tin tra cứu.';
    input.focus();
  });
  example.addEventListener('click', function () {
    input.value = '68C-162.58';
    select.value = '';
    form.requestSubmit();
  });
})();
