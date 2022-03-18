<?php
use PHPUnit\Framework\TestCase;

final class DemoTest extends TestCase
{
    public function testCanBeEqual(): void
    {
        $this->assertEquals('bar', 'bas');
    }


}