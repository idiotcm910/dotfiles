<!DOCTYPE html>                                                              
<html>                                                                       
<body>                                                  
<?php
    $courses = array(
        [
            'mamon'=>'101',
            'tenmon'=>'Thiết kế web 1'
        ],
        [
            'mamon'=>'201',
            'tenmon'=>'Thiết kế web 2' 
        ],
        [
            'mamon'=>'301',
            'tenmon'=>'Lập trình web 1' 
        ],
        [
            'mamon'=>'401',
            'tenmon'=>'Lập trình web 2' 
        ],
    );
?>

<h1>Danh sách các course</h1>
<table border="1" width="100%">
    <thead>
        <tr>
             <th>Mã môn</th>
            <th>Tên môn</th>
             <th>Xem chi tiết</th>
         </tr>
     </thead>
     <tbody>
         <?php foreach ($courses as $course): ?>
             <tr>
                <td><?php echo $course['mamon']?></td>  
                <td><?php echo $course['tenmon']?></td> 
                <td><a href="#">...</a></td>
             </tr>   
         <?php endforeach; ?>
     </tbody>
 </body>
 </html>
