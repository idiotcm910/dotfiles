<!DOCTYPE html>
<html>
<body>
<?php
    $arrCourse[101] = ['name' => 'Thiết kế web 1',
                            'credits' => 4,
                            'duration' => 60,
                            'instructors' => ['John','Lee']];
        $arrCourse[201] = ['name' => 'Thiết kế web 2',
                            'credits' => 4,
                            'duration' => 60,
                            'instructors' => ['John']];
        $arrCourse[301] = ['name' => 'Lập trình web 1',
                            'credits' => 3,
                            'duration' => 60,
                            'instructors' => ['John','Lee']];
        $arrCourse[401] = ['name' => 'Lập trình web 2',
                            'credits' => 2,
                            'duration' => 60,
                            'instructors' => ['John','Lee','Hai']];    
	function in(array $v, string $b) {
		$str = "";
		for($i=0; $i< count($v['instructors']) - 1; $i++)  
		    $str .= $v['instructors'][$i].$b;
		$str .= $v['instructors'][$i];
		echo $str;
	}
?>
<table border="1" >
        <thead>
            <tr>
                <th>Mã MH</th>
                <th>Tên MH</th>
                <th>Số tín chỉ</th>
                <th>Số tiết</th>
                <th>Giảng viên phụ trách</th>
            </tr>
        </thead>
        <tbody>
            <?php
                foreach($arrCourse as $k => $v){?>
               <tr>
                  <td><?php echo $k?></td>
                  <td><?=$v['name']?></td>
                  <td><?=$v['credits']?></td>
                  <td><?=$v['duration']?></td>
                  <td>
                        <?php
							in($v, ',')
                        ?>
                                                     
                  </td>
               </tr>                    
            <?php } ?>          
         </tbody>
</table>
</body>
</html>
