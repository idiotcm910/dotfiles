<!doctype html>
<html>
    <body>
        <h1>What day is it today?</h1>
        <p>Your answer:</p>
        <?php
            /*
                hàm date trả ra ngày tháng năm giờ... dựa trên hệ thống đang chạy
                tham số 'N' cho ta chỉ lấy một con số nguyên (integer) để biết được thứ trong tuần
                1: thứ hai, 2: thứ ba,... 7: chủ nhật
            */
            $dayOfWeek = date('N');
			if($dayOfWeek == 1) {
				echo '<p>Today is Monday';
			}
			if($dayOfWeek == 2) {
				echo '<p>Today is Tuesday';
			}
			if($dayOfWeek == 3) {
				echo '<p>Today is Wednesday';
			}
			if($dayOfWeek == 4) {
				echo '<p>Today is Thursday';
			}
			if($dayOfWeek == 5) {
				echo '<p>Today is Friday';
			}
			if($dayOfWeek == 6) {
				echo '<p>Today is Saturday';
			}
			if($dayOfWeek == 7) {
				echo '<p>Today is Sunday';
			}
            /*
                bạn cần viết code (dùng if) để xuất ra kết quả: Today is xxx,
                với xxx là các giá trị "Monday", "Tuesday",...,"Sunday" dựa trên giá trị của $dayOfWeek
            */
        ?>
    </body>
</html>
